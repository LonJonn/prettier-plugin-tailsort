import type TailSort from '../Tailsort'

// Formats Twin macro
//   eg: `tw\`container w-full sm:(w-1/2)\``

export default function twin(tailsort: TailSort, node: any) {
	if (
		node &&
		node.type === 'TaggedTemplateExpression' &&
		node.tag &&
		node.tag.name === 'tw' &&
		node.quasi &&
		Array.isArray(node.quasi.quasis)
	) {
		node.quasi.quasis.forEach(q => {
			if (q.value && q.value.raw) {
				const rawValue = q.value.raw

				const finalStr = tailsort.sortClasses(rawValue)

				q.value.raw = finalStr
				if (q.value.cooked) {
					q.value.cooked = finalStr
				}
			}
		})
	}

	return node
}
