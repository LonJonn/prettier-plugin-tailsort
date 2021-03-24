import type TailSort from '../Tailsort'

// Formats JSX attributes
//   eg: `<div className="container w-full"></div>`

export default function jsxAttributes(
	tailsort: TailSort,
	node: any,
	attributeNames: string[]
) {
	if (
		node &&
		node.type === 'JSXAttribute' &&
		node.name &&
		node.name.type === 'JSXIdentifier' &&
		attributeNames.includes(node.name.name) &&
		node.value &&
		(node.value.type === 'StringLiteral' || node.value.type === 'Literal')
	) {
		const newValue = tailsort.sortClasses(node.value.value)

		node.value.value = newValue
		node.value.extra = {
			...(node.value.extra || {}),
			rawValue: newValue,
			raw: `"${newValue}"`,
		}
	}

	return node
}
