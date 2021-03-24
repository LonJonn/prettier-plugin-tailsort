import type TailSort from '../Tailsort'
import prettierParserHTML from 'prettier/parser-html'

export default (tailsort: TailSort) => ({
	...prettierParserHTML.parsers.html,
	parse(text, parsers, options) {
		const ast = prettierParserHTML.parsers.html.parse(text, parsers, options)

		if (!tailsort) {
			return ast
		}

		const cleanElementClasses = el => {
			if (el.attrs) {
				const classAttr = el.attrs.find(attr => attr.name === 'class')
				if (classAttr) {
					const classList = classAttr.value
						.split(' ')
						.map(classItem => classItem.trim())
						.filter(classItem => classItem.length > 0)
					classAttr.value = tailsort.sortClasses(classList)
				}
			}

			if (el.children && el.children.length > 0) {
				el.children.forEach(childEl => cleanElementClasses(childEl))
			}
		}
		cleanElementClasses(ast)

		return ast
	},
})
