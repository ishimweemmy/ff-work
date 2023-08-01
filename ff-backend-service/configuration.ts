export const DESIRED_DATASET_SIZE_LIMIT = {
  free: 200,
  premium: 1000,
  enterprise: 10000,
  enterprisePlus: Infinity,
}

export const DATASET_TIER_PRICING = {
  free: 0,
  premium: 10,
  enterprise: 50,
  enterprisePlus: 1000,
}

export const MODEL_NAMES = {
  annotation: 'Annotation',
  asset: 'Asset',
  dataset: 'Dataset',
  datasetLike: 'DatasetLike',
  datasetBookmark: 'DatasetBookmark',
  post: 'Post',
  postLike: 'PostLike',
  user: 'User',
  redactedUser: 'RedactedUser',
  datasetAssetCounts: 'DatasetAssetCounts',
  recipe: 'Recipe',
  label: 'Label',
  pullRequest: 'PullRequest',
  pullRequestItem: 'PullRequestItem',
  pullRequestAsset: 'PullRequestAsset',
  pullRequestMessage: 'PullRequestMessage',
  pullRequestDeleteAsset: 'PullRequestDeleteAsset',
  pullRequestAnnotation: 'PullRequestAnnotation',
  activityMetrics: 'ActivityMetrics',
  datasetPermission: 'DatasetPermission',
  collection: "Collection",
  collectionItem: "CollectionItem",
  dmGroup: "DMGroup",
}
