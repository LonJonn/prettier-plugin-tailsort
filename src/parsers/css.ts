import type TailSort from '../Tailsort'
import prettierParserPostCSS from 'prettier/parser-postcss'
import loopNodes from '../utils/loop-nodes'

export default (tailsort: TailSort) => ({
	...prettierParserPostCSS.parsers.css,
	parse(text, parsers, options) {
		const ast = prettierParserPostCSS.parsers.css.parse(text, parsers, options)

		if (!tailsort) {
			return ast
		}

		const result = loopNodes(ast, node => {
			if (
				node &&
				node.type === 'css-atrule' &&
				node.name === 'apply' &&
				node.params
			) {
				const newValue = tailsort.sortClasses(node.params)

				node.params = newValue
			}

			return node
		})

		return result
	},
})
