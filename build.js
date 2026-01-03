
/**
 * ===================================================================================
 * BUILD.JS (Standalone / Open Source)
 * ===================================================================================
 * This script automates the build process for the public version of SizeRight.
 * It runs tests, compiles documentation, optimizes CSS/JS, and bundles everything 
 * into a single production-ready HTML file.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const beautify = require('js-beautify').html;
const terser = require('terser');
const { marked } = require('marked');

async function build() {

    // -------------------------------------------------------------------------
    // 1. INTEGRITY CHECK (Unit Tests)
    // -------------------------------------------------------------------------
    try {
        console.log('[Build] 🧪 Running unit tests...');
        // Executes 'npm test'. If tests fail, the build is aborted immediately
        // to prevent compiling broken code.
        execSync('npm test', { stdio: 'inherit' });
        console.log('✅ [Build] All tests passed.');
    } catch (error) {
        console.error('❌ [Build] Unit tests failed. Build aborted.');
        process.exit(1);
    }

    console.log('\n[Build] 🚀 Starting compilation process...');

    try {
        // -------------------------------------------------------------------------
        // 2. READ SOURCE FILES
        // -------------------------------------------------------------------------
        console.log('[Build] 📂 Reading source files...');
        
        // Load base assets (HTML Skeleton, Configuration, Localization, Styles)
        const template = await fs.readFile(path.join(__dirname, 'template.html'), 'utf8');
        let configJsonContent = await fs.readFile(path.join(__dirname, 'config.json'), 'utf8');
        let languageJsonContent = await fs.readFile(path.join(__dirname, 'language.json'), 'utf8');
        let styleCss = await fs.readFile(path.join(__dirname, 'style.css'), 'utf8');

        // Define application modules in the correct loading order
        const scriptFiles = [ 
            'Sortable.min.js',
            '1_main.js', '2_render.js', '3_events.js', '4_modals.js', '5_visualizations.js', '6_utils.js'
        ];

        // Sortable.min.js is already minified and handled separately
        const sortableJsContent = await fs.readFile(path.join(__dirname, 'Sortable.min.js'), 'utf8');
        
        // Concatenate all custom application scripts into one string
        let appScriptJs = '';
        const appScriptFiles = scriptFiles.filter(file => file !== 'Sortable.min.js');
        for (const file of appScriptFiles) {
            appScriptJs += await fs.readFile(path.join(__dirname, file), 'utf8') + '\n';
        }

        // Extract version from the HTML meta tag
        const versionMatch = template.match(/<meta\s+name="version"\s+content="([^"]+)"/);
        const version = versionMatch ? versionMatch[1] : 'unknown';

        // -------------------------------------------------------------------------
        // 3. PROCESS DOCUMENTATION
        // -------------------------------------------------------------------------
        console.log('[Build] 📖 Processing documentation...');
        
        // Load the HTML container for documentation
        const docTemplate = await fs.readFile(path.join(__dirname, 'documentation_template.html'), 'utf8');
        const languageDataForBuild = JSON.parse(languageJsonContent);
        const documentation = {};

        // Iterate through languages, find corresponding Markdown files, and convert to HTML
        for (const lang in languageDataForBuild) {
             try {
                const markdownContent = await fs.readFile(path.join(__dirname, 'documentation_' + lang + '.md'), 'utf8');
                const htmlContent = marked(markdownContent);
                // Combine converted Markdown with the documentation container
                documentation[lang] = htmlContent + docTemplate;
             } catch(e) { 
                 console.log('  [Build] Info: No documentation found for language: ' + lang); 
             }
        }

        // -------------------------------------------------------------------------
        // 4. PREPARE CONFIGURATION & CSS FORMATTING
        // -------------------------------------------------------------------------
        console.log('[Build] ⚙️  Preparing configuration & Formatting CSS...');
        
        // CSS Optimization: "Flat-Line" format (one selector per line)
        // 1. Remove comments
        styleCss = styleCss.replace(/\/\*[\s\S]*?\*\//g, '')
                           // 2. Normalize whitespace (tabs/newlines -> space)
                           .replace(/[\r\n\t]+/g, ' ')
                           // 3. Reduce multiple spaces
                           .replace(/\s+/g, ' ')
                           // 4. Format braces and semicolons for readability/parsing
                           .replace(/\s*\{\s*/g, ' { ')
                           .replace(/\s*;\s*/g, '; ')
                           .replace(/\s*}\s*/g, ' }\n')
                           .replace(/  +/g, ' ').trim();

        const configDataForBuild = JSON.parse(configJsonContent);

        // Inject processed documentation HTML into the language objects
        for (const lang in languageDataForBuild) {
            if (languageDataForBuild[lang] && documentation[lang]) {
                 languageDataForBuild[lang].documentationHtml = documentation[lang];
            }
        }
        
        // Finalize configuration object
        configDataForBuild.languages = languageDataForBuild;
        const defaultLang = configDataForBuild.defaultSettings.language || 'de';
        configDataForBuild.uiStrings = languageDataForBuild[defaultLang];
        configDataForBuild.buildNumber = null; // No build number in public release
        const finalConfigJson = JSON.stringify(configDataForBuild);

        // -------------------------------------------------------------------------
        // 5. MINIFICATION (JavaScript)
        // -------------------------------------------------------------------------
        console.log('[Build] 📦 Minifying JavaScript (Terser)...');
        
        // Compress application code to reduce file size
        const terserResult = await terser.minify(appScriptJs);
        if (terserResult.error) throw terserResult.error;
        
        // Combine Sortable library with minified app code
        const scriptJs = sortableJsContent + '\n' + terserResult.code;

        // -------------------------------------------------------------------------
        // 6. ASSET INJECTION & OUTPUT
        // -------------------------------------------------------------------------
        console.log('[Build] 💉 Injecting assets into template...');
        
        // Inject CSS, Config, and JS into the HTML placeholders
        let finalHtml = template
            .replace('<style id="style-placeholder"></style>', `<style>\n${styleCss}\n</style>`)
            .replace('<script id="config-placeholder" type="application/json"></script>', `<script id="size-right-config" type="application/json">\n${finalConfigJson}\n</script>`)
            .replace('<script id="script-placeholder"></script>', `<script>\n${scriptJs}\n</script>`);

        // Format the final HTML for better readability
        const formattedHtml = beautify(finalHtml, { indent_size: 4 });
        const outputHtmlFileName = 'SizeRight_Build_(v.' + version + ').html';
        
        // Write the single-file application to disk
        await fs.writeFile(path.join(__dirname, outputHtmlFileName), formattedHtml);
        
        console.log('✅ [Build] Success! Output created: "' + outputHtmlFileName + '"');

    } catch (error) {
        console.error('❌ [Build] Fatal Error:', error.message);
        process.exit(1);
    }
}
build();
