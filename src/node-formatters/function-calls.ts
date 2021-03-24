import type TailSort from '../Tailsort'

// Formats function calls
//   eg: `clsx('container w-full')`

export default function functionCalls(
	tailsort: TailSort,
	node: any,
	functionNames: string[]
) {
	if (
		node &&
		node.type === 'CallExpression' &&
		node.callee &&
		node.callee.type === 'Identifier' &&
		functionNames.some(functionName => functionName === node.callee.name)
	) {
		node.arguments.forEach(arg => {
			if (arg.type !== 'StringLiteral' && arg.type !== 'Literal') {
				return
			}

			const spacesBefore = arg.value.length - arg.value.trimStart().length
			const spacesAfter = arg.value.length - arg.value.trimEnd().length

			let newValue = ''
			newValue += ' '.repeat(spacesBefore)
			newValue += tailsort.sortClasses(arg.value)
			newValue += ' '.repeat(spacesAfter)

			if (arg.type === 'StringLiteral') {
				arg.value = newValue
				if (arg.extra) {
					arg.extra.rawValue = newValue
					arg.extra.raw = `"${newValue}"`
				}
			} else if (arg.type === 'Literal') {
				arg.value = newValue
				arg.raw = `"${newValue}"`
			}
		})
	}

	return node
}
