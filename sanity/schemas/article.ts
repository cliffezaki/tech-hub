import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'article',
    title: 'Article',
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
            name: 'excerpt',
            title: 'Excerpt',
            type: 'text',
            rows: 3,
            description: 'Short summary shown on cards and in search results',
        }),
        defineField({
            name: 'author',
            title: 'Author',
            type: 'string',
        }),
        defineField({
            name: 'imageUrl',
            title: 'Featured image URL',
            type: 'url',
            description:
                'Set automatically when you upload an image from the Tech Hub dashboard. Leave empty to use the Main image field below instead.',
        }),
        defineField({
            name: 'imageAlt',
            title: 'Image alt text',
            type: 'string',
            description: 'Describes the image for screen readers and search engines',
        }),
        defineField({
            name: 'imageCredit',
            title: 'Image credit',
            type: 'string',
        }),
        defineField({
            name: 'mainImage',
            title: 'Main image',
            type: 'image',
            description: 'Used when no featured image URL is set',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'string',
            description: 'Free-text label shown above the headline, e.g. "Artificial Intelligence"',
        }),
        defineField({
            name: 'section',
            title: 'Section',
            type: 'string',
            description: 'Which part of the site this appears in',
            options: {
                list: [
                    { title: 'News', value: 'news' },
                    { title: 'Reviews', value: 'reviews' },
                    { title: 'How To', value: 'how-to' },
                    { title: 'How Stuff Works', value: 'how-stuff-works' },
                    { title: 'Tech Kenya', value: 'tech-kenya' },
                ],
            },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'status',
            title: 'Status',
            type: 'string',
            initialValue: 'published',
            options: {
                list: [
                    { title: 'Published', value: 'published' },
                    { title: 'Draft', value: 'draft' },
                ],
                layout: 'radio',
            },
        }),
        defineField({
            name: 'featured',
            title: 'Featured',
            type: 'boolean',
            initialValue: false,
            description: 'Featured articles are promoted on the homepage',
        }),
        defineField({
            name: 'publishedAt',
            title: 'Published at',
            type: 'datetime',
        }),
        defineField({
            name: 'readTime',
            title: 'Read time',
            type: 'string',
            description: 'e.g. "5 min read"',
        }),
        defineField({
            name: 'content',
            title: 'Article body (Markdown)',
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
                {
                    type: 'block',
                },
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
            author: 'author',
            media: 'mainImage',
            section: 'section',
        },
        prepare(selection) {
            const { author, section } = selection
            return {
                ...selection,
                subtitle: [section, author && `by ${author}`].filter(Boolean).join(' · '),
            }
        },
    },
})
