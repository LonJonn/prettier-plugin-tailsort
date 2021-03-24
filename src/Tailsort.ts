import path from 'path'
import { Options, StyleNode } from './types'

export default class TailSort {
	public static readConfig() {
		return path.join(process.cwd(), 'tailwind.config.js')
	}

	private sortedSelectors: string[]
	private config: any
	private defaultConfig: any
	private processPlugins: any
	private resolveConfig: any
	private tailwindInstallPath: string
	private tailwindPluginsPath: string
	private pluginOrder: string[]
	private modifierOrder: string[]

	/**
	 * Creates an instance of TWClassesSorter.
	 */
	constructor(opts: Options = {}) {
		if (opts.config == undefined) {
			opts.config = TailSort.readConfig()
		}

		this.pluginOrder = opts.pluginOrder || DEFAULT_PLUGIN_ORDER
		this.modifierOrder = opts.modifierOrder || DEFAULT_MODIFIER_ORDER

		if (!opts.nodeModulesPath) {
			opts.nodeModulesPath = path.resolve(process.cwd(), 'node_modules')
		}

		this.tailwindInstallPath = path.join(opts.nodeModulesPath, 'tailwindcss')

		this.defaultConfig = require(path.join(
			this.tailwindInstallPath,
			'stubs/defaultConfig.stub.js'
		))
		this.processPlugins = require(path.join(
			this.tailwindInstallPath,
			'lib/util/processPlugins'
		)).default
		this.resolveConfig = require(path.join(
			this.tailwindInstallPath,
			'lib/util/resolveConfig'
		)).default

		this.tailwindPluginsPath = path.join(
			this.tailwindInstallPath,
			'lib',
			'plugins'
		)

		this.config = this.resolveConfig([opts.config || {}, this.defaultConfig])
		this.sortedSelectors = this.getAllSelectors()
	}

	public sortClasses = (str: string) => {
		if (!str.includes(' ')) return str

		const parts = this.parse(str)
		if (parts.length === 1) {
			const sortedInner = this.sortClasses(this.getInnerBrackets(str).trim())
			str = str.split('(')[0] + `(${sortedInner})`
		} else {
			str = parts
				.map(this.sortClasses)
				.sort((a, b) => {
					const aParts = this.getClassParts(a)
					const bParts = this.getClassParts(b)

					const aClassBaseIndex = this.sortedSelectors.indexOf(aParts.base)
					const bClassBaseIndex = this.sortedSelectors.indexOf(bParts.base)
					const aFirstModIndex = this.modifierOrder.indexOf(aParts.mods[0])
					const bFirstModIndex = this.modifierOrder.indexOf(bParts.mods[0])

					//#region Unknown

					// _:* vs * Move unknown mod to start
					if (bFirstModIndex === -1 && bParts.mods.length > 0) return 1
					if (aFirstModIndex === -1 && aParts.mods.length > 0) return -1

					// *:_ Move mods with unknown seperator to start
					if (aFirstModIndex > 0 && aClassBaseIndex === -1 && !aParts.group)
						return -1
					if (bFirstModIndex > 0 && bClassBaseIndex === -1 && !bParts.group)
						return 1

					// _ vs * Move unknown class to start
					if (aClassBaseIndex !== -1 && bClassBaseIndex === -1 && !bParts.group)
						return 1
					if (aClassBaseIndex === -1 && bClassBaseIndex !== -1 && !aParts.group)
						return -1

					//#endregion

					//#region Modifiers

					// Move modifiers to end
					if (aParts.mods.length > 0 && bParts.mods.length === 0) return 1
					if (bParts.mods.length > 0 && aParts.mods.length === 0) return -1

					// *: Sort by first mod based off order list
					if (aFirstModIndex > bFirstModIndex) return 1
					if (aFirstModIndex < bFirstModIndex) return -1

					// More specific modifiers (e.g. more modifiers count) go after
					if (aParts.mods.length > bParts.mods.length) return 1
					if (aParts.mods.length < bParts.mods.length) return -1

					// If modifiers are different, re-order
					if (!aParts.mods.every(m => bParts.mods.includes(m))) {
						const aSecondModIndex = this.modifierOrder.indexOf(aParts.mods[1])
						const bSecondModIndex = this.modifierOrder.indexOf(bParts.mods[1])
						return aSecondModIndex > bSecondModIndex ? 1 : -1
					}

					// If they have the same number of modifiers, group goes after
					if (aParts.mods.every(m => bParts.mods.includes(m))) {
						if (aParts.group && !bParts.group) return 1
						if (!aParts.group && bParts.group) return -1
					}

					//#endregion

					// * vs * Sort by base class
					if (aClassBaseIndex !== -1 && bClassBaseIndex !== -1) {
						if (aClassBaseIndex > bClassBaseIndex) return 1
						if (aClassBaseIndex < bClassBaseIndex) return -1
					}

					return 0
				})
				.join(' ')
		}

		return str
	}

	private getAllSelectors(): string[] {
		const allComponentSelectors: string[] = []
		const allUtilitySelectors: string[] = []

		this.pluginOrder
			.filter(pluginName =>
				this.config.corePlugins.some(
					(corePlugin: string) => corePlugin === pluginName
				)
			)
			.forEach(pluginName => {
				const filename = path.join(this.tailwindPluginsPath, `${pluginName}.js`)

				const pluginModule = require(filename)
				const pluginDefault =
					typeof pluginModule === 'function'
						? pluginModule()
						: pluginModule.default()

				const { components, utilities } = this.processPlugins(
					[pluginDefault],
					this.config
				)

				allComponentSelectors.push(...this.getSelectors(components))
				allUtilitySelectors.push(...this.getSelectors(utilities))
			})

		return [...allComponentSelectors, ...allUtilitySelectors]
	}

	private loopObjectForSelectors(obj: StyleNode): string[] {
		const selectors: string[] = []
		switch (obj.type) {
			case 'rule': {
				if (obj.selector) {
					let cleanedValue = obj.selector
						.trim()
						.split(' ')[0]
						.replace(/\\/g, '')
					if (cleanedValue.startsWith('.')) {
						cleanedValue = cleanedValue.substr(1)
					}
					selectors.push(cleanedValue)
				}
				return selectors
			}
			case 'decl':
				return selectors
			case 'atrule': {
				if (obj.name && obj.name.startsWith('keyframes')) {
					return selectors
				}
			}
			default: {
				if (Array.isArray(obj.nodes)) {
					selectors.push(
						...obj.nodes.reduce<string[]>(
							(acc, node) => [...acc, ...this.loopObjectForSelectors(node)],
							[]
						)
					)
				}
				return selectors
			}
		}
	}

	private getSelectors(styles: any[]): string[] {
		return [
			...new Set(
				styles.reduce<string[]>((acc, style) => {
					const selectors = this.loopObjectForSelectors(style)
					acc.push(...selectors)
					return acc
				}, [])
			),
		].sort()
	}

	private parse(str: string) {
		const result: string[] = []
		let item = ''
		let depth = 0

		function push() {
			if (item) result.push(item)
			item = ''
		}

		for (let i = 0, c; (c = str[i]), i < str.length; i++) {
			if (depth === 0 && c === ' ') push()
			else {
				item += c
				if (c === '(') depth++
				if (c === ')') depth--
			}
		}

		push()
		return result
	}

	private getInnerBrackets(str: string) {
		const openIdx = str.indexOf('(')
		const lastIdx = str.lastIndexOf(')')

		return str.substring(openIdx + 1, lastIdx)
	}

	private getClassParts(str: string) {
		if (str.includes('(')) {
			const parts = str.split(/\((.+)/)
			return {
				group: true,
				mods: parts[0].split(':').filter(Boolean),
				base: parts[1],
			}
		}

		if (str.includes(':')) {
			const lastIdx = str.lastIndexOf(':')
			return {
				group: false,
				mods: str.slice(0, lastIdx).split(':').filter(Boolean),
				base: str.slice(lastIdx + 1),
			}
		}

		return {
			group: false,
			mods: [],
			base: str,
		}
	}
}

const DEFAULT_PLUGIN_ORDER = [
	'container',
	'position',
	'zIndex',
	'inset',
	'display',
	'flex',
	'flexDirection',
	'flexGrow',
	'flexShrink',
	'flexWrap',
	'gap',
	'gridAutoFlow',
	'gridColumn',
	'gridColumnEnd',
	'gridColumnStart',
	'gridRow',
	'gridRowEnd',
	'gridRowStart',
	'gridTemplateColumns',
	'gridTemplateRows',
	'alignContent',
	'alignItems',
	'alignSelf',
	'justifyContent',
	'justifyItems',
	'justifySelf',
	'verticalAlign',
	'placeContent',
	'placeItems',
	'placeSelf',
	'float',
	'clear',
	'order',
	'tableLayout',
	'width',
	'minWidth',
	'maxWidth',
	'height',
	'maxHeight',
	'minHeight',
	'margin',
	'padding',
	'textAlign',
	'textDecoration',
	'textOpacity',
	'wordBreak',
	'whitespace',
	'fontFamily',
	'fontSize',
	'fontSmoothing',
	'fontStyle',
	'fontVariantNumeric',
	'fontWeight',
	'letterSpacing',
	'lineHeight',
	'textColor',
	'backgroundColor',
	'backgroundImage',
	'backgroundSize',
	'backgroundPosition',
	'backgroundRepeat',
	'backgroundAttachment',
	'backgroundClip',
	'backgroundOpacity',
	'borderWidth',
	'borderStyle',
	'borderColor',
	'borderOpacity',
	'borderRadius',
	'borderCollapse',
	'placeholderColor',
	'placeholderOpacity',
	'outline',
	'fill',
	'stroke',
	'strokeWidth',
	'boxShadow',
	'gradientColorStops',
	'opacity',
	'visibility',
	'accessibility',
	'appearance',
	'boxSizing',
	'cursor',
	'pointerEvents',
	'userSelect',
	'divideColor',
	'divideOpacity',
	'divideStyle',
	'divideWidth',
	'listStylePosition',
	'listStyleType',
	'objectFit',
	'objectPosition',
	'overflow',
	'overscrollBehavior',
	'transform',
	'transformOrigin',
	'translate',
	'textTransform',
	'resize',
	'rotate',
	'scale',
	'skew',
	'space',
	'animation',
	'transitionProperty',
	'transitionDuration',
	'transitionDelay',
	'transitionTimingFunction',
	'preflight',
]

const DEFAULT_MODIFIER_ORDER = [
	'hover',
	'active',
	'focus',
	'disabled',
	'checked',
	'dark',
	'sm',
	'md',
	'lg',
	'xl',
]
