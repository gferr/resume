const handlebars = require('handlebars');
const fs = require('fs-extra');
const markdownHelper = require('./utils/helpers/markdown');
const templateData = require('./metadata/metadata');
const Puppeteer = require('puppeteer');
const getSlug = require('speakingurl');
const dayjs = require('dayjs');

const srcDir = __dirname;
const outputDir = __dirname + '/../dest';

// Clear dest dir
fs.emptyDirSync(outputDir);

// Copy assets
fs.copySync(srcDir + '/assets', outputDir);
fs.copySync(`${srcDir}/../node_modules/dom-i18n/dist`, `${outputDir}/js`)
fs.ensureDirSync(`${outputDir}/pdf`)

getPdfName = lang => `pdf/${getSlug(templateData.name)}_${lang}.pdf`;

buildHtml = (pdf, lang, dateFormat) => template({
    ...templateData,
    pdf,
    language: lang,
    updated: dayjs().format(dateFormat),
});

buildPdf = async function(inputFile, outputFile) {
    const browser = await Puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`file://${inputFile}`, {
        waitUntil: 'networkidle0'
    });
    await page.pdf({
        path: outputFile,
        format: 'A4',
        border: 0,
        margin: {
            top: '1.5cm',
            right: '2.54cm',
            bottom: '1cm',
            left: '2.54cm',
        },
        displayHeaderFooter: true,
        headerTemplate: "<div/>",
        footerTemplate: "<div style=\"text-align: right;width: 297mm;font-size: 8px;\"><span style=\"margin-right: 0.8cm\"><span class=\"pageNumber\"></span> of <span class=\"totalPages\"></span></span></div>"
    });
    await browser.close();
};

buildPdfSync = async(inputFile, outputFile) => {
    await buildPdf(inputFile, outputFile)
    fs.removeSync(inputFile);
}

// Build HTML
handlebars.registerHelper('markdown', markdownHelper);
const source = fs.readFileSync(srcDir + '/templates/index.html', 'utf-8');
const template = handlebars.compile(source);
const pdf = {
    en: getPdfName('en'),
    fr: getPdfName('fr'),
    pt: getPdfName('pt')
}
const html = buildHtml(pdf, 'en', 'MMMM D, YYYY');
fs.writeFileSync(outputDir + '/index.html', html);
// Build PDF
buildPdf(`${outputDir}/index.html`, `${outputDir}/${pdf.en}`);

const frHtml = buildHtml(pdf, 'fr', 'DD/MM/YYYY');
fs.writeFileSync(`${outputDir}/index.fr.html`, frHtml);
buildPdfSync(`${outputDir}/index.fr.html`, `${outputDir}/${pdf.fr}`);

const ptHtml = buildHtml(pdf, 'pt', 'DD/MM/YYYY');
fs.writeFileSync(`${outputDir}/index.pt.html`, ptHtml);
buildPdfSync(`${outputDir}/index.pt.html`, `${outputDir}/${pdf.pt}`);