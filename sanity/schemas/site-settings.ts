import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'siteSettings',
    title: 'Site settings',
    type: 'document',
    fields: [
        defineField({ name: 'siteName', title: 'Site name', type: 'string' }),
        defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
        ...['logoLight', 'logoDark', 'logoSame', 'logoWidth', 'iconSource', 'icon16', 'icon32', 'icon180', 'icon192', 'icon512', 'iconIco', 'identityVersion', 'socialImage', 'socialTitle', 'socialDescription'].map(name => defineField({ name, title: name, type: 'string', readOnly: true, description: 'Managed through Settings → Site Identity in the Tech Hub dashboard.' })),
        defineField({
            name: 'heroEyebrow',
            title: 'Homepage hero label',
            type: 'string',
            description: 'Small label above the lead story, e.g. "Today\'s lead story"',
        }),
        defineField({
            name: 'heroTitle',
            title: 'Homepage hero headline override',
            type: 'string',
            description: 'Leave empty to use the featured article headline',
        }),
        defineField({
            name: 'heroSubtitle',
            title: 'Homepage hero summary override',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'heroArticleId',
            title: 'Pinned lead article id',
            type: 'string',
            description: 'Set from the Tech Hub dashboard homepage screen',
        }),
        defineField({ name: 'newsletterTitle', title: 'Newsletter title', type: 'string' }),
        defineField({ name: 'newsletterText', title: 'Newsletter text', type: 'text', rows: 2 }),
        defineField({ name: 'footerText', title: 'Footer text', type: 'text', rows: 2 }),
        defineField({ name: 'contactEmail', title: 'Contact email', type: 'string' }),
        defineField({ name: 'twitterUrl', title: 'X / Twitter URL', type: 'url' }),
        defineField({ name: 'linkedinUrl', title: 'LinkedIn URL', type: 'url' }),
        defineField({ name: 'youtubeUrl', title: 'YouTube URL', type: 'url' }),
    ],
    preview: {
        prepare() {
            return { title: 'Site settings' }
        },
    },
})
