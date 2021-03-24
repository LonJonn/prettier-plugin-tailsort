export interface Options {
	/** Tailwind config path or object */
	config?: any | string
	/** Custom path to node_modules */
	nodeModulesPath?: string
	/** Plugin order to sort by */
	pluginOrder?: string[]
	/** Mofidifer order to sort by */
	modifierOrder?: string[]
}

export interface StyleNode {
	type: string
	name?: string
	nodes?: StyleNode[]
	selector?: string
}
