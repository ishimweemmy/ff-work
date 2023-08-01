import { setup, teardown } from '@/tests/unit/base'
import userFixture from '@/tests/unit/users/fixture'
import recipeFixture from '@/tests/unit/recipes/fixture'
import labelFixture from '@/tests/unit/labels/fixture'
import datasetFixture from '@/tests/unit/datasets/fixture'
import assetFixture from '@/tests/unit/assets/fixture'
import { IUser } from '@/domains/users/models/UserModel'
import annotationFixture from '@/tests/unit/annotations/fixture'
import mongoose, { HydratedDocument, Mongoose } from 'mongoose'
import { IRecipe } from '@/domains/recipes/model'
import Label, { ANNOTATION_TOOL_ENUM, ILabel } from '@/domains/labels/model'
import { IDataset } from '@/domains/datasets/model'
import Asset, { IAsset } from '@/domains/assets/model'
import Annotation, { IAnnotation } from '@/domains/annotations/model'
import { IPullRequest } from '@/domains/pullRequests/model'
import PullRequestRepository from '@/domains/pullRequests/repository'
import { ObjectId } from '@/utils/abbreviations'
import { NotFoundError, PermissionError } from '@/utils/errors'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'
import PullRequestAssetRepository from '@/domains/pullRequests/items/assets/repository'
import fs from 'fs'
import path from 'path'
import mime from 'mime-types'
import PullRequestAsset, { IPullRequestAsset } from '@/domains/pullRequests/items/assets/assetModel'
import dataset from '@/routes/microservices/dataset'
import PullRequestDeleteAsset from '@/domains/pullRequests/items/assets/deleteAssetModel'
import PullRequestAnnotationRepository from '@/domains/pullRequests/items/annotations/repository'
import { generateAnnotationData } from '@/tests/unit/annotations/generate'
import PullRequestAnnotation, { IPullRequestAnnotation } from '@/domains/pullRequests/items/annotations/model'
import AnnotationRepository, { PopulatedAnnotation } from '@/domains/annotations/repository'
import { GetObjectCommand, NoSuchKey, S3Client } from '@aws-sdk/client-s3'
import * as config from '@/utils/config'
import * as process from 'process'
import lodash from 'lodash'

const s3 = new S3Client(config.S3_CONFIG)
const annotationRepo = new AnnotationRepository()
const pullRequestRepo = new PullRequestRepository()
const pullRequestAssetRepo = new PullRequestAssetRepository()
const pullRequestAnnotationRepo = new PullRequestAnnotationRepository()
const datasetPermissionRepo = new DatasetPermissionRepository()

describe('pullRequestRepository', function () {
  let testUsers: IUser[],
    testRecipes: HydratedDocument<IRecipe>[],
    testLabels: HydratedDocument<ILabel>[],
    testDatasets: HydratedDocument<IDataset>[],
    testAssets: HydratedDocument<IAsset>[][],
    testAnnotations: HydratedDocument<IAnnotation>[]

  let targetedEntities: {
    pullRequest: HydratedDocument<IPullRequest>,
    pullRequestAsset: HydratedDocument<IPullRequestAsset>
    pullRequestAssets: HydratedDocument<IPullRequestAsset>[]
    pullRequestAnnotation: HydratedDocument<IPullRequestAnnotation>
    pullRequestAnnotationOnExistingAnnotation: HydratedDocument<IPullRequestAnnotation>,
    secondPullRequest: HydratedDocument<IPullRequest>,
  } = {} as any

  beforeAll(async () => {
    await setup()
    testUsers = await userFixture()
    testRecipes = await recipeFixture()
    testLabels = await labelFixture()
    testDatasets = (await datasetFixture()).imageDatasets
    testAssets = (await assetFixture()).images
    testAnnotations = await annotationFixture()
  })
  afterAll(async () => {
    await teardown()
  })

  test('Create pull request', async () => {
    const pr = await pullRequestRepo.createPullRequest({
      user: testUsers[2],
      dataset: testDatasets[0],
      name: 'Test pull request',
    })

    expect(pr.name).toEqual('Test pull request')
    expect(pr.createdAt).toBeInstanceOf(Date)
    expect(pr.updatedAt).toBeInstanceOf(Date)
    expect(pr.dataset).toBeInstanceOf(ObjectId)
    expect(pr.user).toBeInstanceOf(ObjectId)
    expect(pr.status).toEqual('draft')

    targetedEntities.pullRequest = pr
  })

  test('Retrieve pull request', async () => {
    const pr = await pullRequestRepo.getPullRequestById(targetedEntities.pullRequest._id)

    expect(pr.name).toEqual('Test pull request')
    expect(pr.createdAt).toEqual(targetedEntities.pullRequest.createdAt)
    expect(pr.updatedAt).toEqual(targetedEntities.pullRequest.updatedAt)
    expect(pr.dataset.toString()).toEqual(targetedEntities.pullRequest.dataset.toString())
    expect(pr.user.toString()).toEqual(targetedEntities.pullRequest.user.toString())
  })

  test('Retrieve not found pull request', async () => {
    const attempt = pullRequestRepo.getPullRequestById(new ObjectId())

    await expect(attempt).rejects.toBeInstanceOf(NotFoundError)
  })

  test('Edit pull request', async () => {
    const pr = await pullRequestRepo.getPullRequestById(targetedEntities.pullRequest._id)

    await pullRequestRepo.editPullRequest(pr, {
      name: 'New pull request',
    })

    const editedPr = await pullRequestRepo.getPullRequestById(targetedEntities.pullRequest._id)

    await expect(editedPr.name).toEqual('New pull request')
    await expect(editedPr.dataset).toEqual(targetedEntities.pullRequest.dataset)
    await expect(editedPr.createdAt).toEqual(targetedEntities.pullRequest.createdAt)
  })

  test('Expand in pull requests - should create a separate object. Original object should stay unmodified. ' +
    'This can be done by rehydrating and dehydrating.', async () => {
    const expanded = await pullRequestRepo.expandPullRequests([targetedEntities.pullRequest], ['user', 'dataset'])
    expect(targetedEntities.pullRequest.dataset).toBeInstanceOf(ObjectId)
    expect(targetedEntities.pullRequest.user).toBeInstanceOf(ObjectId)
    expect(expanded[0].user).toBeTruthy()
    expect(expanded[0].dataset).toBeTruthy()
    expect(typeof (expanded[0].user as IUser).fullName).toEqual('string')
    expect((expanded[0].user as IUser).hash).toBeFalsy()
    expect((expanded[0].user as IUser).salt).toBeFalsy()
    expect(typeof (expanded[0].dataset as IDataset).name).toEqual('string')
    expect((expanded[0].dataset as IDataset).createdAt).toBeInstanceOf(Date)
  })

  test('Assign permissions.', async () => {
    await datasetPermissionRepo.assignPermission(testDatasets[0], testUsers[1], 'blocked')
    await datasetPermissionRepo.assignPermission(testDatasets[0], testUsers[2], 'contributor')
    await datasetPermissionRepo.assignPermission(testDatasets[0], testUsers[3], 'contributor')
    await datasetPermissionRepo.assignPermission(testDatasets[0], testUsers[4], 'admin')
    await datasetPermissionRepo.assignPermission(testDatasets[0], testUsers[5], 'maintainer')
  })

  describe('Permission tests', () => {
    async function doTest (permissionObj: Record<'read' | 'write' | 'review', boolean>, user: IUser) {
      for (let [key, value] of Object.entries(permissionObj)) {
        if (value) {
          await expect(await pullRequestRepo.requestPullRequestPermission(targetedEntities.pullRequest, user, key as keyof typeof permissionObj)).resolves
        } else {
          await expect(pullRequestRepo.requestPullRequestPermission(targetedEntities.pullRequest, user, key as keyof typeof permissionObj)).rejects.toBeInstanceOf(PermissionError)
        }
      }
    }

    const blockedPermission: Record<'read' | 'write' | 'review', boolean> = {
      read: false,
      review: false,
      write: false,
    }
    const contributorPermission: Record<'read' | 'write' | 'review', boolean> = {
      read: true,
      review: false,
      write: false,
    }
    const initiatorPermission: Record<'read' | 'write' | 'review', boolean> = {
      read: true,
      review: false,
      write: true,
    }
    const maintainerPermission: Record<'read' | 'write' | 'review', boolean> = {
      read: true,
      review: true,
      write: true,
    }
    const adminPermission: Record<'read' | 'write' | 'review', boolean> = {
      read: true,
      review: true,
      write: true,
    }
    const ownerPermission: Record<'read' | 'write' | 'review', boolean> = {
      read: true,
      review: true,
      write: true,
    }
    test('Blocked users cannot access.', async () => {
      await doTest(blockedPermission, testUsers[1])
    })
    test('Contributor users can only read.', async () => {
      await doTest(contributorPermission, testUsers[3])
    })
    test('PR initiator can also write but cannot review.', async () => {
      await doTest(initiatorPermission, testUsers[2])
    })
    test('Maintainers can review.', async () => {
      await doTest(maintainerPermission, testUsers[5])
    })
    test('Admins can review.', async () => {
      await doTest(adminPermission, testUsers[4])
    })
    test('Owner can review.', async () => {
      await doTest(ownerPermission, testUsers[0])
    })
    test('Blocking the initiator prevents the initiator from accessing the PR.', async () => {
      await datasetPermissionRepo.assignPermission(testDatasets[0], testUsers[2], 'blocked')
      await doTest(blockedPermission, testUsers[2])
    })
  })

  const testFiles: Express.Multer.File[] = []
  const ASSET_DIR = './tests/assets/images'
  test('Add asset to a PR.', async () => {
    for (let file of await fs.promises.readdir(ASSET_DIR)) {
      const fp = path.join(ASSET_DIR, file)
      const fstat = await fs.promises.stat(fp)
      testFiles.push({
        size: fstat.size,
        buffer: await fs.promises.readFile(fp),
        path: fp,
        originalname: file,
        filename: file,
        mimetype: mime.lookup(file) || '',
        fieldname: 'image',
      } as Express.Multer.File)
    }
    targetedEntities.pullRequestAsset = await pullRequestAssetRepo.addImageToPullRequest(targetedEntities.pullRequest, testFiles[0])
  })

  test('View PR asset.', async () => {
    const fetched = await pullRequestAssetRepo.getNewAssetInPullRequestById(targetedEntities.pullRequestAsset._id)
    expect(typeof fetched.size).toEqual('number')
    expect(fetched.size).toEqual(targetedEntities.pullRequestAsset.size)
    expect(fetched.itemType).toEqual('asset')
    expect(fetched.pullRequest._id.toString()).toEqual(targetedEntities.pullRequest._id.toString())
    expect(fetched.uploadedAt).toBeInstanceOf(Date)
  })

  test('Upload multiple assets.', async () => {
    targetedEntities.pullRequestAssets = []
    for (let file of testFiles) {
      targetedEntities.pullRequestAssets.push(await pullRequestAssetRepo.addImageToPullRequest(targetedEntities.pullRequest, file))
    }
  })

  test('Queue deletion of existing asset.', async () => {
    const targetedAssets = await Asset.find({
      dataset: testDatasets[0]
    }).populate<{ dataset: IDataset }>('dataset').limit(2)

    for (let targetedAsset of targetedAssets) {
      await pullRequestAssetRepo.queueDeletionOfExistingAsset(targetedEntities.pullRequest, targetedAsset)
      const delObj = await PullRequestDeleteAsset.findOne({
        pullRequest: targetedEntities.pullRequest._id,
        targetedAsset: targetedAsset._id,
      })
      expect(delObj!.targetedAsset.toString()).toEqual(targetedAsset._id.toString())
      expect(delObj!.pullRequest.toString()).toEqual(targetedEntities.pullRequest._id.toString())
    }
  })

  test('Queue deletion of assets from another dataset will cause failure.', async () => {
    const wrongAsset = await Asset.findOne({
      dataset: testDatasets[1]
    }).populate<{ dataset: IDataset }>('dataset')

    if (!wrongAsset) {
      throw new Error('Aborting - required assets are not found.')
    }

    await expect(pullRequestAssetRepo.queueDeletionOfExistingAsset(targetedEntities.pullRequest, wrongAsset)).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })

  test('De-queue deletion of assets.', async () => {
    const targetedAsset = await Asset.findOne({
      dataset: testDatasets[0]
    }).populate<{ dataset: IDataset }>('dataset')

    if (!targetedAsset) {
      throw new Error('Aborting - required assets are not found.')
    }

    await expect(pullRequestAssetRepo.unQueueDeletionOfExistingAsset(targetedEntities.pullRequest, targetedAsset)).resolves
    const delObj2 = await PullRequestDeleteAsset.find({
      pullRequest: targetedEntities.pullRequest._id,
      targetedAsset: targetedAsset._id,
    })
    expect(delObj2).toEqual([])
  })

  test('Add annotations to an already existing asset.', async () => {
    const targetedAsset = await Asset.findOne({
      dataset: testDatasets[0]
    }).populate<{ dataset: IDataset }>('dataset')

    if (!targetedAsset) {
      throw new Error('Aborting - required assets are not found.')
    }

    for (let tool of ANNOTATION_TOOL_ENUM._def.values) {
      const label = await Label.findOne({
        recipe: testDatasets[0].recipe,
        tool: tool,
      })
      if (!label) {
        throw new Error('Label not found - test aborting.')
      }

      const data = {
        data: generateAnnotationData(tool),
        label: label._id,
      }

      const newAnnotationObj = await pullRequestAnnotationRepo.addAnnotationToExistingAsset(targetedEntities.pullRequest, targetedAsset, data)
      expect(newAnnotationObj._id).toBeInstanceOf(ObjectId)
      expect(newAnnotationObj.newAnnotation?.data).toEqual(data.data)
      expect(newAnnotationObj.newAnnotation?.label.toString()).toEqual(data.label.toString())

      targetedEntities.pullRequestAnnotationOnExistingAnnotation = newAnnotationObj
    }
  })

  test('Adding data that is incompatible with current label will throw an error.', async () => {
    const targetedAsset = await Asset.findOne({
      dataset: testDatasets[0]
    }).populate<{ dataset: IDataset }>('dataset')

    if (!targetedAsset) {
      throw new Error('Aborting - required assets are not found.')
    }

    const wrongLabel = await Label.findOne({
      recipe: testDatasets[0].recipe,
      tool: 'polygon',
    })
    if (!wrongLabel) {
      throw new Error('Label not found - test aborting.')
    }

    const wrongLabelAttempt = pullRequestAnnotationRepo.addAnnotationToExistingAsset(targetedEntities.pullRequest, targetedAsset, {
      data: generateAnnotationData('boundingBox'),
      label: wrongLabel._id,
    })
    await expect(wrongLabelAttempt).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })

  test('Adding a label from a different recipe than the targeted dataset will also throw an error.', async () => {
    const targetedAsset = await Asset.findOne({
      dataset: testDatasets[0]
    }).populate<{ dataset: IDataset }>('dataset')

    if (!targetedAsset) {
      throw new Error('Aborting - required assets are not found.')
    }

    const wrongLabel = await Label.findOne({
      recipe: {
        $ne: testDatasets[0].recipe,
      },
      tool: 'polygon',
    })
    if (!wrongLabel) {
      throw new Error('Label not found - test aborting.')
    }

    const wrongLabelAttempt = pullRequestAnnotationRepo.addAnnotationToExistingAsset(targetedEntities.pullRequest, targetedAsset, {
      data: generateAnnotationData('polygon'),
      label: wrongLabel._id,
    })
    await expect(wrongLabelAttempt).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })

  test('Adding annotations to an asset in the wrong dataset will throw an error.', async () => {
    const wrongAsset = await Asset.findOne({
      dataset: testDatasets[1]
    }).populate<{ dataset: IDataset }>('dataset')

    if (!wrongAsset) {
      throw new Error('Aborting - required assets are not found.')
    }

    const label = await Label.findOne({
      recipe: testDatasets[0].recipe,
      tool: 'boundingBox',
    })
    if (!label) {
      throw new Error('Label not found - test aborting.')
    }

    const data = {
      data: generateAnnotationData('boundingBox'),
      label: label._id,
    }

    const attempt = pullRequestAnnotationRepo.addAnnotationToExistingAsset(targetedEntities.pullRequest, wrongAsset, data)
    await expect(attempt).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })

  test('Add annotation on pull request asset.', async () => {
    const testPrAsset = await pullRequestAssetRepo.getNewAssetInPullRequestById(targetedEntities.pullRequestAssets[0]._id)

    for (let tool of ANNOTATION_TOOL_ENUM._def.values) {
      const label = await Label.findOne({
        recipe: testDatasets[0].recipe,
        tool: 'boundingBox',
      })
      if (!label) {
        throw new Error('Label not found - test aborting.')
      }

      const data = {
        data: generateAnnotationData('boundingBox'),
        label: label._id,
      }

      const newAnnotation = await pullRequestAnnotationRepo.addAnnotationToPullRequestAsset(testPrAsset, data)
      expect(newAnnotation.targetedPullRequestAsset?._id).toBeInstanceOf(ObjectId)
      expect(newAnnotation.targetedPullRequestAsset?._id.toString()).toEqual(targetedEntities.pullRequestAssets[0]._id.toString())
      expect(newAnnotation.newAnnotation?.data).toEqual(data.data)
      expect(newAnnotation.newAnnotation?.label.toString()).toEqual(data.label.toString())
      expect(newAnnotation.pullRequest).toEqual(targetedEntities.pullRequest._id)
      targetedEntities.pullRequestAnnotation = newAnnotation
    }
  })

  test('Incompatible annotations must be rejected.', async () => {
    const testPrAsset = await pullRequestAssetRepo.getNewAssetInPullRequestById(targetedEntities.pullRequestAssets[0]._id)

    const label = await Label.findOne({
      recipe: testDatasets[0].recipe,
      tool: 'polygon',
    })
    if (!label) {
      throw new Error('Label not found - test aborting.')
    }

    const data = {
      data: generateAnnotationData('boundingBox'),
      label: label._id,
    }

    const attempt = pullRequestAnnotationRepo.addAnnotationToPullRequestAsset(testPrAsset, data)
    await expect(attempt).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })

  test('Get PR annotation.', async () => {
    const annotation = await pullRequestAnnotationRepo.getPullRequestAnnotationById(targetedEntities.pullRequestAnnotation._id)
    await expect(annotation.newAnnotation?.data).toEqual(targetedEntities.pullRequestAnnotation.newAnnotation?.data)
    await expect(annotation._id).toEqual(targetedEntities.pullRequestAnnotation._id)
  })

  test('Edit the current PR annotation.', async () => {
    const annotation = await pullRequestAnnotationRepo.getPullRequestAnnotationById(targetedEntities.pullRequestAnnotation._id)

    const label = await Label.findOne({
      recipe: testDatasets[0].recipe,
      tool: 'polygon',
    }).skip(1)
    if (!label) {
      throw new Error('Label not found - test aborting.')
    }

    const data = {
      data: generateAnnotationData('polygon'),
      label: label._id,
    }

    await pullRequestAnnotationRepo.editPullRequestAnnotation(annotation, data)

    const editedAnnotation = await pullRequestAnnotationRepo.getPullRequestAnnotationById(targetedEntities.pullRequestAnnotation._id)
    expect(editedAnnotation.newAnnotation?.data).toEqual(data.data)
    expect(editedAnnotation.newAnnotation?.label.toString()).toEqual(data.label.toString())
  })

  test('Delete PR annotation.', async () => {
    const annotation = await pullRequestAnnotationRepo.getPullRequestAnnotationById(targetedEntities.pullRequestAnnotation._id)
    await pullRequestAnnotationRepo.deletePullRequestAnnotation(annotation)
    const attempt = pullRequestAnnotationRepo.getPullRequestAnnotationById(targetedEntities.pullRequestAnnotation._id)
    await expect(attempt).rejects.toBeInstanceOf(NotFoundError)
  })

  test('Delete already existing annotation - should create a new deletion object.', async () => {
    const targetedAnnotation = testAnnotations.find(annotation => annotation.asset.toString() === testAssets[0][3]._id.toString())
    if (!targetedAnnotation) {
      throw new Error('Targeted annotation not found.')
    }

    const populated = await annotationRepo.getAnnotationById(targetedAnnotation._id)
    await pullRequestAnnotationRepo.deleteExistingAnnotation(targetedEntities.pullRequest, populated)
    const item = await PullRequestAnnotation.findOne({
      pullRequest: targetedEntities.pullRequest._id,
      targetedAnnotation: populated._id,
    })

    if (!item) {
      throw new Error('Missing annotation!')
    }

    expect(item.targetedAnnotation?.toString()).toEqual(populated._id.toString())
    expect(item.newAnnotation).toEqual(undefined)
  })

  test('Try to delete already existing annotation, but in the wrong dataset.', async () => {
    const targetedAnnotation = testAnnotations.find(annotation => annotation.asset.toString() === testAssets[1][0]._id.toString())
    if (!targetedAnnotation) {
      throw new Error('Targeted annotation not found.')
    }
    const populated = await annotationRepo.getAnnotationById(targetedAnnotation._id)
    const attempt = pullRequestAnnotationRepo.deleteExistingAnnotation(targetedEntities.pullRequest, populated)
    await expect(attempt).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })

  test('Try to edit already existing annotation, but in the wrong dataset.', async () => {
    const targetedAnnotation = testAnnotations.find(annotation => annotation.asset.toString() === testAssets[1][0]._id.toString())
    if (!targetedAnnotation) {
      throw new Error('Targeted annotation not found.')
    }
    const label = await Label.findOne({
      recipe: testDatasets[0].recipe,
      tool: 'polygon',
    }).skip(1)
    if (!label) {
      throw new Error('Required label not found - test skipping.')
    }
    const populated = await annotationRepo.getAnnotationById(targetedAnnotation._id)
    const attempt = pullRequestAnnotationRepo.editExistingAnnotation(targetedEntities.pullRequest, populated, {
      label: label._id,
      data: generateAnnotationData('polygon')
    })
    await expect(attempt).rejects.toBeInstanceOf(mongoose.Error.ValidationError)
  })

  test('Restore existing annotation.', async () => {
    const targetedAnnotation = testAnnotations.find(annotation => annotation.asset.toString() === testAssets[0][3]._id.toString())
    if (!targetedAnnotation) {
      throw new Error('Targeted annotation not found.')
    }

    const populated = await annotationRepo.getAnnotationById(targetedAnnotation._id)
    await pullRequestAnnotationRepo.revertExistingAnnotation(targetedEntities.pullRequest, populated)
    const item = await PullRequestAnnotation.findOne({
      pullRequest: targetedEntities.pullRequest._id,
      targetedAnnotation: populated._id,
    })
    expect(item).toEqual(null)
  })

  test('Update existing annotation.', async () => {
    const targetedAnnotation = testAnnotations.find(annotation => annotation.asset.toString() === testAssets[0][3]._id.toString())
    if (!targetedAnnotation) {
      throw new Error('Targeted annotation not found.')
    }

    const label = await Label.findOne({
      recipe: testDatasets[0].recipe,
      tool: 'boundingBox',
    }).skip(1)
    if (!label) {
      throw new Error('Label not found - test aborting.')
    }

    const data = {
      data: generateAnnotationData('boundingBox'),
      label: label._id,
    }

    const populated = await annotationRepo.getAnnotationById(targetedAnnotation._id)
    await pullRequestAnnotationRepo.editExistingAnnotation(targetedEntities.pullRequest, populated, data)
    const item = await PullRequestAnnotation.findOne({
      pullRequest: targetedEntities.pullRequest._id,
      targetedAnnotation: populated._id,
    })
    expect(item!.newAnnotation?.data).toEqual(data.data)
    expect(item!.newAnnotation?.label.toString()).toEqual(data.label.toString())
  })

  test('Delete PR asset causes nested annotations to get deleted.', async () => {
    const fetched = await pullRequestAssetRepo.getNewAssetInPullRequestById(targetedEntities.pullRequestAsset._id)
    await pullRequestAssetRepo.deleteNewAssetFromPullRequest(fetched)

    const attempt = pullRequestAssetRepo.getNewAssetInPullRequestById(targetedEntities.pullRequestAsset._id)
    await expect(attempt).rejects.toBeInstanceOf(NotFoundError)

    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fetched._id.toString(),
    })
    await expect(async () => s3.send(command)).rejects.toBeInstanceOf(NoSuchKey)

    expect((await PullRequestAnnotation.find({
      targetedPullRequestAsset: fetched._id,
    })).length).toEqual(0)
  })

  test('Deleting entire PR causes everything in that PR to get deleted, but must not affect other PRs.', async () => {
    const secondPr = await pullRequestRepo.createPullRequest({
      name: 'Second pull request',
      user: testUsers[2],
      dataset: testDatasets[0],
    })
    targetedEntities.secondPullRequest = secondPr

    const secondPrAssetsPromises = []
    for (let file of testFiles) {
      secondPrAssetsPromises.push(pullRequestAssetRepo.addImageToPullRequest(secondPr, file))
    }
    const secondPrAssets = await Promise.all(secondPrAssetsPromises)

    const secondPrAnnotationObjects = []
    for (let asset of secondPrAssets) {
      const populated = await pullRequestAssetRepo.getNewAssetInPullRequestById(asset._id)
      for (let tool of ANNOTATION_TOOL_ENUM._def.values) {
        const label = await Label.findOne({
          tool: tool,
          recipe: testDatasets[0].recipe,
        })
        if (!label) {
          throw new Error('No targeted label found - test stopping.')
        }
        secondPrAnnotationObjects.push(await pullRequestAnnotationRepo.addAnnotationToPullRequestAsset(populated, {
          label: label._id,
          data: generateAnnotationData(tool)
        }))
      }
    }

    const secondPrDeleteAssets = []
    const sample = await Asset.find({
      dataset: testDatasets[0],
    }).limit(3).populate<{ dataset: IDataset }>('dataset')
    for (let targetedAsset of sample) {
      secondPrDeleteAssets.push(await pullRequestAssetRepo.queueDeletionOfExistingAsset(secondPr, targetedAsset))

      for (let tool of ANNOTATION_TOOL_ENUM._def.values) {
        const label = await Label.findOne({
          tool: tool,
          recipe: testDatasets[0].recipe,
        })
        if (!label) {
          throw new Error('No targeted label found - test stopping.')
        }
        secondPrAnnotationObjects.push(await pullRequestAnnotationRepo.addAnnotationToExistingAsset(secondPr, targetedAsset, {
          label: label._id,
          data: generateAnnotationData(tool)
        }))
      }

      const existingAnnotation = await Annotation.findOne({
        asset: targetedAsset._id,
      }).populate<{
        asset: IAsset & {
          dataset: IDataset
        },
        label: ILabel
      }>({
        path: 'asset',
        populate: {
          path: 'dataset'
        }
      }).populate('label')
      secondPrAnnotationObjects.push(await pullRequestAnnotationRepo.editExistingAnnotation(secondPr, existingAnnotation!, {
        data: generateAnnotationData(existingAnnotation!.label.tool),
        label: existingAnnotation!.label._id,
      }))
    }

    await pullRequestRepo.deletePullRequest(targetedEntities.pullRequest)
    for (let deletedAsset of targetedEntities.pullRequestAssets) {
      await expect(s3.send(new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: deletedAsset._id.toString()
      }))).rejects.toBeInstanceOf(NoSuchKey)
    }
    expect((await PullRequestAsset.find({
      pullRequest: targetedEntities.pullRequest._id
    })).length).toEqual(0)
    expect((await PullRequestAnnotation.find({
      pullRequest: targetedEntities.pullRequest._id
    })).length).toEqual(0)
    expect((await PullRequestDeleteAsset.find({
      pullRequest: targetedEntities.pullRequest._id
    })).length).toEqual(0)

    const populatedPrAssets = (await PullRequestAsset.find({
      pullRequest: secondPr._id
    }))
    expect(populatedPrAssets.length).toEqual(secondPrAssets.length)
    for (let foundAsset of populatedPrAssets) {
      expect((await s3.send(new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: foundAsset._id.toString(),
      })))).toBeTruthy()
    }
    expect((await PullRequestAnnotation.find({
      pullRequest: secondPr._id
    })).length).toEqual(secondPrAnnotationObjects.length)
    expect((await PullRequestDeleteAsset.find({
      pullRequest: secondPr._id
    })).length).toEqual(secondPrDeleteAssets.length)
  })

  test('Lookup multiple assets that is added to the PR.', async () => {
    const result = await pullRequestAssetRepo.searchPullRequestAssetsByPullRequest(targetedEntities.secondPullRequest, {})
    for (let item of result.data) {
      const populatedItem = await pullRequestAssetRepo.getNewAssetInPullRequestById(item._id)
      expect(populatedItem.pullRequest._id).toEqual(targetedEntities.secondPullRequest._id)
    }
  })

  // Needs more comprehensive tests
  test('Lookup multiple assets whose annotation data is altered by the PR.', async () => {
    const result = await pullRequestAssetRepo.searchExistingAssetsAlteredByPullRequest(targetedEntities.secondPullRequest, {})
    const populated = await Asset.populate(result.data, {
      path: 'pullRequestAnnotationData',
      match: {
        pullRequest: targetedEntities.secondPullRequest._id,
      }
    })
    for (let item of populated) {
      expect(item.pullRequestAnnotationData).toBeTruthy()
      expect(item.pullRequestAnnotationData?.length).toBeGreaterThan(0)
    }
  })

  test('Statistics.', async () => {
    const result = await pullRequestRepo.getPullRequestStats([targetedEntities.secondPullRequest]).then(res => res[0])
    expect(result.newAssets).toBeGreaterThan(0)
    expect(result.changedAssets).toBeGreaterThan(0)
    expect(result.deletedAssets).toBeGreaterThan(0)
  })

  test('Lookup multiple assets that are deleted by the PR.', async () => {
    const result = await pullRequestAssetRepo.searchExistingAssetsDeletedByPullRequest(targetedEntities.secondPullRequest, {})
    for (let item of result.data) {
      expect(await PullRequestDeleteAsset.findOne({
        pullRequest: targetedEntities.secondPullRequest,
        targetedAsset: item._id,
      })).toBeTruthy()
    }
  })

  test('Merge test of pull requests.', async () => {
    const pullRequest3 = await pullRequestRepo.createPullRequest({
      user: testUsers[0],
      dataset: testDatasets[0],
      name: 'Merge test',
    })

    const assets = await Asset.find({
      dataset: testDatasets[0]
    }).populate<{ dataset: IDataset }>('dataset')

    const annotations = await Annotation.find({
      asset: {
        $in: assets.map(item => item._id)
      }
    }).populate<{ asset: IAsset & { dataset: IDataset }, label: ILabel }>({
      path: 'asset',
      populate: 'dataset',
    }).populate('label')

    // Block 1 - Pull request's new asset.
    const newAssets = []

    for (let file of testFiles) {
      newAssets.push(await pullRequestAssetRepo.addImageToPullRequest(pullRequest3, file))
    }

    // Block 2 - Pull request's new asset annotations.
    const newAssetAnnotations = []
    const annotationCountPerNewAsset = 2
    for (let newAsset of newAssets) {
      for (let i = 0; i < annotationCountPerNewAsset; i++) {
        const populated = await pullRequestAssetRepo.getNewAssetInPullRequestById(newAsset._id)
        const label = await Label.findOne({
          recipe: testDatasets[0].recipe,
          tool: lodash.sample(ANNOTATION_TOOL_ENUM._def.values),
        })
        newAssetAnnotations.push(await pullRequestAnnotationRepo.addAnnotationToPullRequestAsset(populated, {
          label: label!._id,
          data: generateAnnotationData(label!.tool),
        }))
      }
    }

    // Block 3 - Changed and deleted existing annotations.
    const affectedAnnotationsCount = 14
    const affectedAnnotations = lodash.sampleSize(annotations, affectedAnnotationsCount)
    const changedAnnotations = affectedAnnotations.slice(0, Math.round(affectedAnnotationsCount / 2))
    const deletedAnnotations = affectedAnnotations.slice(Math.round(affectedAnnotationsCount / 2))

    for (let annotation of changedAnnotations) {
      const populated = await annotationRepo.getAnnotationById(annotation._id)
      await pullRequestAnnotationRepo.editExistingAnnotation(pullRequest3, populated, {
        data: generateAnnotationData(annotation.label.tool),
        label: annotation.label._id,
      })
    }

    for (let annotation of deletedAnnotations) {
      const populated = await annotationRepo.getAnnotationById(annotation._id)
      await pullRequestAnnotationRepo.deleteExistingAnnotation(pullRequest3, populated)
    }

    // Block 4 - New annotations on existing assets.
    const affectedAssetsWithNewAnnotationsCount = 3
    const affectedAssetsWithNewAnnotations = lodash.sampleSize(assets, affectedAssetsWithNewAnnotationsCount)
    for (let asset of affectedAssetsWithNewAnnotations) {
      const label = await Label.findOne({
        recipe: testDatasets[0].recipe,
        tool: lodash.sample(ANNOTATION_TOOL_ENUM._def.values),
      })
      await pullRequestAnnotationRepo.addAnnotationToExistingAsset(pullRequest3, asset, {
        data: generateAnnotationData(label!.tool),
        label: label!._id,
      })
    }

    // Block 5 - Delete existing assets - they do not have any annotations added or have any of its annotations altered.
    const assetsNotDeleted = [...affectedAssetsWithNewAnnotations.map(item => item._id), ...affectedAnnotations.map(item => item.asset._id)]
    const assetsToDelete = await Asset.find({
      dataset: testDatasets[0]._id,
      _id: {
        $nin: assetsNotDeleted,
      }
    }).limit(3).populate<{ dataset: IDataset }>({
      path: 'dataset',
    })
    const assetsToDeleteCount = assetsToDelete.length
    for (let toDelete of assetsToDelete) {
      await pullRequestAssetRepo.queueDeletionOfExistingAsset(pullRequest3, toDelete)
    }
    const cascadedDeletedAnnotationCounts = await Annotation.find({
      asset: {
        $in: assetsToDelete.map(asset => asset._id),
      }
    }).count()

    // Block 6 - merge and test.
    await pullRequestRepo.mergePullRequest(pullRequest3)

    const remainingAssetCount = assets.length + newAssets.length - assetsToDeleteCount
    const remainingAnnotationsCount = annotations.length + newAssetAnnotations.length + affectedAssetsWithNewAnnotationsCount - deletedAnnotations.length - cascadedDeletedAnnotationCounts

    const resultingAssets = await Asset.find({
      dataset: testDatasets[0]
    })
    const resultingAnnotations = await Annotation.find({
      asset: {
        $in: resultingAssets.map(asset => asset._id)
      }
    })
    expect(resultingAssets.length).toEqual(remainingAssetCount)
    expect(resultingAnnotations.length).toEqual(remainingAnnotationsCount)
  })
})
