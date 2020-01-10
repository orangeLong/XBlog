module.exports = {
	title: 'XZero',
	description: 'XZero\'s simple blog',
	markdown: {
		lineNumbers: true
	},
	themeConfig: {
		nav: [
			{text: 'XZero', link: '/'},
			{text: '技术', items: [
				{text: 'iOS', link: '/skill/'},
				{text: 'Vue', link: '/skill/'},
				{text: 'Node', link: '/skill/'},
				{text: 'Base', link: '/skill/'},
			]},
			{text: '树洞', link: '/hole/one'},
			{text: 'GitHub', link: 'https://github.com/orangeLong'}
		],
		displayAllHeaders: true,
		sidebarDepth: 2,
		sidebar: {
			'/skill/': [
				'',
				'one',
				'two'
			],
			'/hole/': [
				'one',
				'two'
			],
			// '/': [
			// 	'',
			// 	'config'
			// ]
		}
	}
}
