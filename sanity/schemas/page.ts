import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'page',
    title: 'Page',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'status',
            title: 'Status',
            type: 'string',
            initialValue: 'draft',
            options: {
                list: [
                    { title: 'Draft', value: 'draft' },
                    { title: 'Published', value: 'published' },
                ],
                layout: 'radio',
            },
        }),
        defineField({
            name: 'excerpt',
            title: 'Excerpt',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'content',
            title: 'Page body (Markdown)',
            type: 'text',
            rows: 24,
            description: 'The format the Tech Hub dashboard writes and reads.',
        }),
        defineField({
            name: 'body',
            title: 'Rich text body (optional)',
            type: 'array',
            description: 'Only used when the Markdown body above is empty.',
            of: [
                { type: 'block' },
                {
                    type: 'image',
                    options: { hotspot: true },
                },
            ],
        }),
    ],
    preview: {
        select: {
            title: 'title',
            status: 'status',
        },
        prepare(selection) {
            return {
                ...selection,
                subtitle: selection.status || 'draft',
            }
        },
    },
})
