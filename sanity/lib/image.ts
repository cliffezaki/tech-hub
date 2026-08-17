import { createImageUrlBuilder } from '@sanity/image-url'

import { dataset, projectId } from '../env'

const imageBuilder = createImageUrlBuilder({
    projectId: projectId || '',
    dataset: dataset || '',
})

export type ImageSource = Parameters<typeof imageBuilder.image>[0]

export const urlForImage = (source: ImageSource) => {
    return imageBuilder.image(source).auto('format').fit('max')
}
