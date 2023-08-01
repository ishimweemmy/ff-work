import '@/tests/unit/base'
import { setup, teardown } from '@/tests/unit/base'
import userFixture from '@/tests/unit/users/fixture'
import recipeFixture from '@/tests/unit/recipes/fixture'
import datasetFixture from '@/tests/unit/datasets/fixture'
import labelFixture from '@/tests/unit/labels/fixture'
import { IUser } from '@/domains/users/models/UserModel'
import { HydratedDocument } from 'mongoose'
import { IRecipe } from '@/domains/recipes/model'
import Label, { ILabel } from '@/domains/labels/model'
import { IDataset } from '@/domains/datasets/model'
import DatasetPermissionRepository from '@/domains/datasets/permissions/repository'
import DatasetPermission, { DatasetRole, IDatasetPermission } from '@/domains/datasets/permissions/model'
import { NotFoundError, PermissionError, PurchaseUnavailableError } from '@/utils/errors'
import DatasetRepository from '@/domains/datasets/repository'
import lodash from 'lodash'
import { ObjectId } from '@/utils/abbreviations'
import * as console from 'console'

const datasetPermissionRepo = new DatasetPermissionRepository()
const datasetRepo = new DatasetRepository()

describe('permissionRepository', () => {
  let testUsers: IUser[]
  let testRecipes: HydratedDocument<IRecipe>[]
  let testLabels: HydratedDocument<ILabel>[]
  let testDatasets: HydratedDocument<IDataset>[]
  let testPermissionObj: HydratedDocument<IDatasetPermission>
  const users: {
    blockedUser: IUser,
    contributorUser: IUser,
    maintainerUser: IUser,
    adminUser: IUser,
    ownerUser: IUser,
    normalUser: IUser,
  } = {} as any
  beforeAll(async () => {
    await setup()
    testUsers = await userFixture()
    testRecipes = await recipeFixture()
    testLabels = await labelFixture()
    testDatasets = (await datasetFixture()).imageDatasets
  })
  afterAll(async () => {
    await teardown()
  })
  test('Create permissions for users.', async () => {
    users.ownerUser = testUsers[0]
    users.adminUser = testUsers[1]
    users.maintainerUser = testUsers[2]
    users.contributorUser = testUsers[3]
    users.normalUser = testUsers[4]
    users.blockedUser = testUsers[5]

    const permission = await datasetPermissionRepo.assignPermission(testDatasets[0], users.blockedUser, 'blocked')
    expect(permission.user.toString()).toEqual(users.blockedUser._id.toString())
    testPermissionObj = permission;
    await datasetPermissionRepo.assignPermission(testDatasets[0], users.contributorUser, 'contributor')
    await datasetPermissionRepo.assignPermission(testDatasets[0], users.maintainerUser, 'maintainer')
    await datasetPermissionRepo.assignPermission(testDatasets[0], users.adminUser, 'admin')

    testDatasets[1].public = true
    await testDatasets[1].save()
    await datasetPermissionRepo.assignPermission(testDatasets[1], users.blockedUser, 'blocked')
    await datasetPermissionRepo.assignPermission(testDatasets[1], users.contributorUser, 'contributor')
    await datasetPermissionRepo.assignPermission(testDatasets[1], users.maintainerUser, 'maintainer')
    await datasetPermissionRepo.assignPermission(testDatasets[1], users.adminUser, 'admin')

    testDatasets[2].public = true
    testDatasets[2].price = 6.66
    await testDatasets[2].save()
    await datasetPermissionRepo.assignPermission(testDatasets[2], users.blockedUser, 'blocked')
    await datasetPermissionRepo.assignPermission(testDatasets[2], users.contributorUser, 'contributor')
    await datasetPermissionRepo.assignPermission(testDatasets[2], users.maintainerUser, 'maintainer')
    await datasetPermissionRepo.assignPermission(testDatasets[2], users.adminUser, 'admin')
  })
  test('Get permission by ID', async () => {
    const perm = await datasetPermissionRepo.getDatasetPermissionById(testPermissionObj._id)
    expect(perm.role).toEqual("blocked")
    expect(perm.dataset._id.toString()).toEqual(testDatasets[0]._id.toString())
    expect(perm.user._id).toEqual(users.blockedUser._id)
  })
  test('Users who already have explicit permission objects cannot buy access to the dataset regardless of dataset status.', async () => {
    for (let user of [users.blockedUser, users.adminUser, users.contributorUser, users.ownerUser]) {
      await expect(datasetRepo.createDatasetPurchaseSession(testDatasets[0], user)).rejects.toBeInstanceOf(PurchaseUnavailableError)
      await expect(datasetRepo.createDatasetPurchaseSession(testDatasets[1], user)).rejects.toBeInstanceOf(PurchaseUnavailableError)
      await expect(datasetRepo.createDatasetPurchaseSession(testDatasets[2], user)).rejects.toBeInstanceOf(PurchaseUnavailableError)
    }
  })
  test('Private datasets cannot be sold.', async () => {
    await expect(datasetRepo.createDatasetPurchaseSession(testDatasets[0], users.normalUser)).rejects.toThrowError(PurchaseUnavailableError)
  })
  test('Public, free datasets cannot be sold.', async () => {
    await expect(datasetRepo.createDatasetPurchaseSession(testDatasets[1], users.normalUser)).rejects.toThrowError(PurchaseUnavailableError)
  })
  test('Public, paid datasets should generate a Stripe link.', async () => {
    const link = await datasetRepo.createDatasetPurchaseSession(testDatasets[2], users.normalUser)
    expect(typeof link).toBe('string')
    expect(link).toBeTruthy()
  })

  async function doTest (dataset: HydratedDocument<IDataset>, permissionObj: Record<string, boolean>, user: IUser) {
    for (let [key, expected] of Object.entries(permissionObj)) {
      if (expected) {
        await expect(datasetPermissionRepo.requestDatasetPermission(dataset, {
          user: user,
          role: key as DatasetRole,
        })).resolves
      } else {
        await expect(datasetPermissionRepo.requestDatasetPermission(dataset, {
          user: user,
          role: key as DatasetRole,
        })).rejects.toBeInstanceOf(PermissionError)
      }
    }
  }
  describe('Private dataset', function () {
    const privateDatasetPermissions = {
      blockedPermissions: {
        'preview': false,
        'contributor': false,
        'maintainer': false,
        'admin': false,
        'owner': false,
      },
      publicPermissions: {
        'preview': false,
        'contributor': false,
        'maintainer': false,
        'admin': false,
        'owner': false,
      },
      contributorPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': false,
        'admin': false,
        'owner': false,
      },
      maintainerPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': true,
        'admin': false,
        'owner': false,
      },
      adminPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': true,
        'admin': true,
        'owner': false,
      },
      ownerPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': true,
        'admin': true,
        'owner': true,
      }
    }
    test('Blocked users cannot access the dataset.', async () => {
      await doTest(testDatasets[0], privateDatasetPermissions.blockedPermissions, users.blockedUser)
    })
    test('Normal users cannot access the dataset.', async () => {
      await doTest(testDatasets[0], privateDatasetPermissions.publicPermissions, users.normalUser)
    })
    test('Contributor users can only preview and contribute.', async () => {
      await doTest(testDatasets[0], privateDatasetPermissions.contributorPermissions, users.contributorUser)
    })
    test('Maintainer users can moderate, validate and reject PRs.', async () => {
      await doTest(testDatasets[0], privateDatasetPermissions.maintainerPermissions, users.maintainerUser)
    })
    test('Admin users can perform admin tasks regarding PRs and dataset modifications.', async () => {
      await doTest(testDatasets[0], privateDatasetPermissions.adminPermissions, users.adminUser)
    })
    test('Owner users get an immediate pass.', async () => {
      await doTest(testDatasets[0], privateDatasetPermissions.ownerPermissions, users.ownerUser)
    })
    test('Aggregation result.', async () => {
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[0]], users.blockedUser))[0].role).toEqual("blocked");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[0]], users.normalUser))[0].role).toEqual("none");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[0]], users.maintainerUser))[0].role).toEqual("maintainer");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[0]], users.contributorUser))[0].role).toEqual("contributor");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[0]], users.adminUser))[0].role).toEqual("admin");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[0]], users.ownerUser))[0].role).toEqual("owner");
    })
  })
  describe('Public, free dataset', function () {
    const publicDatasetPermissions = {
      blockedPermissions: {
        'preview': false,
        'contributor': false,
        'maintainer': false,
        'admin': false,
        'owner': false,
      },
      publicPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': false,
        'admin': false,
        'owner': false,
      },
      contributorPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': false,
        'admin': false,
        'owner': false,
      },
      maintainerPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': true,
        'admin': false,
        'owner': false,
      },
      adminPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': true,
        'admin': true,
        'owner': false,
      },
      ownerPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': true,
        'admin': true,
        'owner': true,
      }
    }
    test('Blocked users cannot access the dataset.', async () => {
      await doTest(testDatasets[1], publicDatasetPermissions.blockedPermissions, users.blockedUser)
    })
    test('Normal users only get public permissions.', async () => {
      await doTest(testDatasets[1], publicDatasetPermissions.publicPermissions, users.normalUser)
    })
    test('Contributor users can only preview and contribute.', async () => {
      await doTest(testDatasets[1], publicDatasetPermissions.contributorPermissions, users.contributorUser)
    })
    test('Maintainer users can moderate, validate and reject PRs.', async () => {
      await doTest(testDatasets[1], publicDatasetPermissions.maintainerPermissions, users.maintainerUser)
    })
    test('Admin users can perform admin tasks regarding PRs and dataset modifications.', async () => {
      await doTest(testDatasets[1], publicDatasetPermissions.adminPermissions, users.adminUser)
    })
    test('Owner users get an immediate pass.', async () => {
      await doTest(testDatasets[1], publicDatasetPermissions.ownerPermissions, users.ownerUser)
    })
    test('Aggregation result.', async () => {
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[1]], users.blockedUser))[0].role).toEqual("blocked");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[1]], users.normalUser))[0].role).toEqual("contributor");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[1]], users.contributorUser))[0].role).toEqual("contributor");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[1]], users.maintainerUser))[0].role).toEqual("maintainer");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[1]], users.adminUser))[0].role).toEqual("admin");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[1]], users.ownerUser))[0].role).toEqual("owner");
    })
  })
  describe('Public, paid dataset', function () {
    const publicDatasetPermissions = {
      blockedPermissions: {
        'preview': false,
        'contributor': false,
        'maintainer': false,
        'admin': false,
        'owner': false,
      },
      publicPermissions: {
        'preview': true,
        'contributor': false,
        'maintainer': false,
        'admin': false,
        'owner': false,
      },
      contributorPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': false,
        'admin': false,
        'owner': false,
      },
      maintainerPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': true,
        'admin': false,
        'owner': false,
      },
      adminPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': true,
        'admin': true,
        'owner': false,
      },
      ownerPermissions: {
        'preview': true,
        'contributor': true,
        'maintainer': true,
        'admin': true,
        'owner': true,
      }
    }
    test('Blocked users cannot access the dataset.', async () => {
      await doTest(testDatasets[2], publicDatasetPermissions.blockedPermissions, users.blockedUser)
    })
    test('Normal users can only preview.', async () => {
      await doTest(testDatasets[2], publicDatasetPermissions.publicPermissions, users.normalUser)
    })
    test('Contributor users can only preview and contribute.', async () => {
      await doTest(testDatasets[2], publicDatasetPermissions.contributorPermissions, users.contributorUser)
    })
    test('Maintainer users can moderate, validate and reject PRs.', async () => {
      await doTest(testDatasets[2], publicDatasetPermissions.maintainerPermissions, users.maintainerUser)
    })
    test('Admin users can perform admin tasks regarding PRs and dataset modifications.', async () => {
      await doTest(testDatasets[2], publicDatasetPermissions.adminPermissions, users.adminUser)
    })
    test('Owner users get an immediate pass.', async () => {
      await doTest(testDatasets[2], publicDatasetPermissions.ownerPermissions, users.ownerUser)
    })
    test('Aggregation result.', async () => {
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[2]], users.blockedUser))[0].role).toEqual("blocked");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[2]], users.normalUser))[0].role).toEqual("preview");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[2]], users.contributorUser))[0].role).toEqual("contributor");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[2]], users.maintainerUser))[0].role).toEqual("maintainer");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[2]], users.adminUser))[0].role).toEqual("admin");
      expect((await datasetPermissionRepo.aggregateDatasetPermissionsByDatasets([testDatasets[2]], users.ownerUser))[0].role).toEqual("owner");
    })
  })
  test('Edit permission by ID', async () => {
    const perm = await datasetPermissionRepo.getDatasetPermissionById(testPermissionObj._id)
    await datasetPermissionRepo.editPermission(perm, "admin");

    const editedPerm = await datasetPermissionRepo.getDatasetPermissionById(testPermissionObj._id)
    expect(editedPerm.role).toEqual("admin")
    expect(editedPerm.dataset._id.toString()).toEqual(testDatasets[0]._id.toString())
    expect(editedPerm.user._id).toEqual(users.blockedUser._id)
  })
  test('Delete permission by ID', async () => {
    const perm = await datasetPermissionRepo.getDatasetPermissionById(testPermissionObj._id)
    await datasetPermissionRepo.revokePermission(perm);

    const attempt = datasetPermissionRepo.getDatasetPermissionById(testPermissionObj._id)
    await expect(attempt).rejects.toBeInstanceOf(NotFoundError)
  })
  test('Assign permissions by dataset randomly', async function () {
    for (let user of testUsers) {
      await datasetPermissionRepo.assignPermission(testDatasets[0], user, lodash.sample(['admin', 'contributor', 'blocked'])!)
      await datasetPermissionRepo.assignPermission(testDatasets[1], user, lodash.sample(['admin', 'contributor', 'blocked'])!)
    }
  })
  test('Get paginated permissions', async function () {
    let previousId: string | undefined = undefined
    let paginatedPermissions: IDatasetPermission[] = []
    const allPermissions = await DatasetPermission.find({
      dataset: testDatasets[0]._id
    }).sort({ _id: -1 })
    do {
      const permissionsPage = await datasetPermissionRepo.getPaginatedPermissionsByDataset(testDatasets[0], {
        pagination: {
          limit: 3,
          next: previousId
        }
      })
      paginatedPermissions.push(...permissionsPage.data)
      previousId = permissionsPage.meta.next;
    } while (previousId)

    const allPermissionsIds = allPermissions.map(perm => perm._id.toString())
    const paginatedPermissionsIds = paginatedPermissions.map(perm => perm._id.toString())
    expect(allPermissionsIds).toEqual(paginatedPermissionsIds)
  })
  test('Search paginated permissions', async function () {
    let previousId: ObjectId | undefined = undefined
    let paginatedPermissions:(IDatasetPermission & {
      user: IUser;
    })[]  = []
    do {
      const permissionsPage = await datasetPermissionRepo.searchPaginatedPermissionsByDataset(testDatasets[0], {
        email: 'hotmail',
        pagination: {
          limit: 3,
          lessThan: previousId
        }
      })
      paginatedPermissions.push(...permissionsPage)
      previousId = permissionsPage[permissionsPage.length - 1]?._id
    } while (previousId)
    for (let perm of paginatedPermissions) {
      expect(perm._id).toBeInstanceOf(ObjectId)
      expect(perm.dataset).toBeInstanceOf(ObjectId)
      expect(typeof perm.role).toBe('string')
      expect(perm.role).toBeTruthy()
      expect(typeof perm.user.email).toBe('string')
      expect(perm.user.email).toBeTruthy()
      expect(typeof perm.user.fullName).toBe('string')
      expect(perm.user.fullName).toBeTruthy()
      expect(perm.user.email).toContain('hotmail')
    }
  })
  test('Get shared datasets', async function() {
    const page = await datasetPermissionRepo.getSharedDatasets({
      user: users.adminUser._id,
    });
    expect(page.data).toBeInstanceOf(Array);
    expect(page.data.length).toBeGreaterThan(0);
    for (let dataset of page.data) {
      expect(typeof dataset.metrics.downloads).toEqual('number');
      expect(typeof dataset.metrics.views).toEqual('number');
      expect(typeof dataset.public).toEqual('boolean');
      expect(typeof dataset.name).toEqual('string');
      expect(dataset.createdAt).toBeInstanceOf(Date);
      expect(dataset.updatedAt).toBeInstanceOf(Date);
      expect(dataset.recipe).toBeInstanceOf(ObjectId);
    }
  });
})
