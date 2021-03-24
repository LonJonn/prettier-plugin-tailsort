import type TailSort from '../Tailsort'
import prettierParserTypescript from 'prettier/parser-typescript'
import loopNodes from '../utils/loop-nodes'
import jsxAttributes from '../node-formatters/jsx-attributes'
import twin from '../node-formatters/twin'
import functionCalls from '../node-formatters/function-calls'
import functionTemplates from '../node-formatters/function-templates'

export default (tailsort: TailSort) => ({
	...prettierParserTypescript.parsers.typescript,
	parse(text, parsers, options) {
		const ast = prettierParserTypescript.parsers.typescript.parse(
			text,
			parsers,
			options
		)

		if (!tailsort) {
			return ast
		}

		const attributeNames: string[] = options.twJsxClassAttributes.split(',')
		const functionNames: string[] = options.twSortFunctions.split(',')

		const result = loopNodes(ast, node => {
			jsxAttributes(tailsort, node, attributeNames)
			twin(tailsort, node)
			functionCalls(tailsort, node, functionNames)
			functionTemplates(tailsort, node, functionNames)

			return node
		})

		return result
	},
})
