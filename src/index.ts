import TailSort from './Tailsort'
import path from 'path'
import parsers from './parsers'
import options from './options'

const tailsort = new TailSort({
	nodeModulesPath: path.join(__dirname, '../../../node_modules'),
})

module.exports = {
	parsers: parsers(tailsort),
	options,
}
