import type TailSort from '../Tailsort'
import html from './html'
import css from './css'
import babel from './babel'
import typescript from './typescript'
import vue from './vue'

export default (tailsort: TailSort) => ({
	html: html(tailsort),
	css: css(tailsort),
	babel: babel(tailsort),
	typescript: typescript(tailsort),
	vue: vue(tailsort),
})
