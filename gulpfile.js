const {src, dest, series, watch} = require(`gulp`)
const del = require(`del`)
const sass = require(`gulp-sass`)
const babel = require(`gulp-babel`)
const htmlCompressor = require(`gulp-htmlmin`)
const htmlValidator = require(`gulp-html`)
const jsLinter = require(`gulp-eslint`)
const jsCompressor = require(`gulp-uglify`)
const imageCompressor = require(`gulp-imagemin`)
const cache = require(`gulp-cache`)
const browserSync = require(`browser-sync`)
const reload = browserSync.reload
let browserChoice = `default`

async function safari() {
	browserChoice = `safari`
}

async function firefox() {
	browserChoice = `firefox`
}

async function chrome() {
	browserChoice = `google chrome`
}

async function opera() {
	browserChoice = `opera`
}

async function edge() {
	browserChoice = `microsoft-edge`
}

async function allBrowsers() {
	browserChoice = [
		`safari`,
		`firefox`,
		`google chrome`,
		`opera`,
		`microsoft-edge`,
	]
}

let validateHTML = () => {
	return src([`app/*.html`]).pipe(htmlValidator())
}

let compressHTML = () => {
	return src([`app/*.html`, `app/**/*.html`])
		.pipe(htmlCompressor({collapseWhitespace: true}))
		.pipe(dest(`dist`))
}

let compileCSSForDev = () => {
	return src(`app/styles/main.scss`)
		.pipe(
			sass({
				outputStyle: `expanded`,
				precision: 10,
			}).on(`error`, sass.logError)
		)
		.pipe(dest(`dist/styles`))
}

let compileCSSForProd = () => {
	return src(`app/styles/main.scss`)
		.pipe(
			sass({
				outputStyle: `compressed`,
				precision: 10,
			}).on(`error`, sass.logError)
		)
		.pipe(dest(`dist/styles`))
}

let transpileJSForDev = () => {
	return src(`app/scripts/*.js`).pipe(babel()).pipe(dest(`dist/scripts`))
}

let transpileJSForProd = () => {
	return src(`app/scripts/*.js`)
		.pipe(babel())
		.pipe(jsCompressor())
		.pipe(dest(`dist/scripts`))
}

let lintJS = () => {
	return src(`app/scripts/*.js`)
		.pipe(
			jsLinter({
				parserOptions: {
					ecmaVersion: 2017,
					sourceType: `module`,
				},
				rules: {
					indent: [2, 4, {SwitchCase: 1}],
					quotes: [2, `backtick`],
					semi: [2, `always`],
					"linebreak-style": [2, `unix`],
					"max-len": [1, 85, 4],
				},
				env: {
					es6: true,
					node: true,
					browser: true,
				},
				extends: `eslint:recommended`,
			})
		)
		.pipe(jsLinter.formatEach(`compact`, process.stderr))
}

let copyUnprocessedAssetsForProd = () => {
	return src(
		[
			`app/*.*`, // Source all files,
			`app/**`, // and all folders,
			`app/fonts/*`, // all fonts
			`app/fonts/*.ttf`, // all fonts
			`!app/*.*`, // or any files in it
			`!app/html/**`, // or any sub folders;
			`!app/images/`, // ignore images;
			`!app/**/*.js`, // ignore JS;
			`!app/styles/**`, // and, ignore Sass/CSS.
		],
		{dot: true}
	).pipe(dest(`dist`))
}

let copyCustomFonts = () => {
	return src([`./app/fonts/*`]).pipe(dest(`dist/fonts`))
}
let copyHTMLFiles = () => {
	return src([`./app/*.html`]).pipe(dest(`dist`))
}

let compressImages = () => {
	return src(`app/images/**/*`)
		.pipe(
			cache(
				imageCompressor({
					optimizationLevel: 3, // For PNG files. Accepts 0 – 7; 3 is default.
					progressive: true, // For JPG files.
					multipass: false, // For SVG files. Set to true for compression.
					interlaced: false, // For GIF files. Set to true for compression.
				})
			)
		)
		.pipe(dest(`dist/images`))
}

let serve = () => {
	browserSync({
		notify: true,
		port: 9000,
		reloadDelay: 50,
		browser: browserChoice,
		server: {
			baseDir: [`dist/`],
		},
	})

	watch(`app/scripts/*.js`, series(lintJS, transpileJSForDev)).on(
		`change`,
		reload
	)

	watch(`app/images/*.*`, series(compressImages)).on(`change`, reload)

	watch(`app/fonts/*.ttf`, series(copyCustomFonts)).on(`change`, reload)

	watch(`app/styles/**/*.scss`, series(compileCSSForDev)).on(`change`, reload)

	watch(`app/*.html`, series(validateHTML, copyHTMLFiles)).on(
		`change`,
		reload
	)
}

async function clean() {
	let fs = require(`fs`),
		i,
		foldersToDelete = [`dist`]

	for (i = 0; i < foldersToDelete.length; i++) {
		try {
			fs.accessSync(foldersToDelete[i], fs.F_OK)
			process.stdout.write(
				`\n\tThe ` +
					foldersToDelete[i] +
					` directory was found and will be deleted.\n`
			)
			del(foldersToDelete[i])
		} catch (e) {
			process.stdout.write(
				`\n\tThe ` +
					foldersToDelete[i] +
					` directory does NOT exist or is NOT accessible.\n`
			)
		}
	}

	process.stdout.write(`\n`)
}

async function listTasks() {
	let exec = require(`child_process`).exec

	exec(`gulp --tasks`, function (error, stdout, stderr) {
		if (null !== error) {
			process.stdout.write(
				`An error was likely generated when invoking ` +
					`the “exec” program in the default task.`
			)
		}

		if (`` !== stderr) {
			process.stdout.write(
				`Content has been written to the stderr stream ` +
					`when invoking the “exec” program in the default task.`
			)
		}

		process.stdout.write(
			`\n\tThis default task does ` +
				`nothing but generate this message. The ` +
				`available tasks are:\n\n${stdout}`
		)
	})
}

exports.safari = series(safari, serve)
exports.firefox = series(firefox, serve)
exports.chrome = series(chrome, serve)
exports.opera = series(opera, serve)
exports.edge = series(edge, serve)
exports.safari = series(safari, serve)
exports.allBrowsers = series(allBrowsers, serve)
exports.validateHTML = validateHTML
exports.compressHTML = compressHTML
exports.compileCSSForDev = compileCSSForDev
exports.compileCSSForProd = compileCSSForProd
exports.transpileJSForDev = transpileJSForDev
exports.transpileJSForProd = transpileJSForProd
exports.lintJS = lintJS
exports.copyUnprocessedAssetsForProd = copyUnprocessedAssetsForProd
exports.copyCustomFonts = copyCustomFonts
exports.copyHTMLFiles = copyHTMLFiles
exports.build = series(
	compressHTML,
	compileCSSForProd,
	transpileJSForProd,
	compressImages,
	copyUnprocessedAssetsForProd,
	copyCustomFonts
)
exports.compressImages = compressImages
exports.serve = series(
	compileCSSForDev,
	lintJS,
	transpileJSForDev,
	copyCustomFonts,
	compressImages,
	validateHTML,
	copyHTMLFiles,
	serve
)
exports.clean = clean
exports.default = listTasks
