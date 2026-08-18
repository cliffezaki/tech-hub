import { type SchemaTypeDefinition } from 'sanity'
import article from './schemas/article'
import page from './schemas/page'
import siteSettings from './schemas/site-settings'

export const schema: { types: SchemaTypeDefinition[] } = {
    types: [article, page, siteSettings],
}
