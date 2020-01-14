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
				{text: 'iOS', link: '/skill/iOS/effective.md'},
				{text: 'Vue', link: '/skill/Vue/'},
				{text: 'Node', link: '/skill/Node/'},
				{text: 'Base', link: '/skill/Base/'},
			]},
			{text: '树洞', link: '/hole/recent'},
			{text: 'GitHub', link: 'https://github.com/orangeLong'}
		],
		// displayAllHeaders: true,
		sidebarDepth: 2,
		sidebar: {
			'/skill/iOS/': [
				'effective',
				'block'
			],
			'/skill/Vue/': [
				'',
			],
			'/skill/Node/': [
				'',
			],
			'/skill/Base/': [
				'',
			],
			'/hole/': [
				'recent',
			],
		}
	}
}
