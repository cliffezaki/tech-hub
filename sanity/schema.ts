import { type SchemaTypeDefinition } from 'sanity'
import article from './schemas/article'
import page from './schemas/page'

export const schema: { types: SchemaTypeDefinition[] } = {
    types: [article, page],
}
