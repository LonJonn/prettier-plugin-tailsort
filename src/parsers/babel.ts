import type TailSort from '../Tailsort'
import prettierParserBabel from 'prettier/parser-babel'
import loopNodes from '../utils/loop-nodes'
import jsxAttributes from '../node-formatters/jsx-attributes'
import functionCalls from '../node-formatters/function-calls'
import functionTemplates from '../node-formatters/function-templates'

export default (tailsort: TailSort) => ({
	...prettierParserBabel.parsers.babel,
	parse(text, parsers, options) {
		const ast = prettierParserBabel.parsers.babel.parse(text, parsers, options)

		if (!tailsort) {
			return ast
		}

		const attributeNames: string[] = options.twJsxClassAttributes.split(',')
		const functionNames: string[] = options.twSortFunctions.split(',')

		const result = loopNodes(ast, node => {
			jsxAttributes(tailsort, node, attributeNames)
			functionCalls(tailsort, node, functionNames)
			functionTemplates(tailsort, node, functionNames)

			return node
		})

		return result
	},
})
