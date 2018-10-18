const cheerio = require('cheerio');
const phantom = require('phantom');
const fs = require('fs-extra');

const searchText = encodeURI('民国');
//豆瓣是15
const startStep = 15;

function logData(fileData) {
  const fileName = './mock/book.json';
  return fs.ensureFile(fileName).then(() => {
    return fs.writeJson(fileName, fileData, {spaces: 2})
  });
}

function getNumber(str) {
  return str.replace(/[^0-9]/ig, "");
}

function readJson() {
  const fileName = './mock/book.json';
  return fs.ensureFile(fileName).then(() => {
    return fs.readJson(fileName);
  });
}

async function queryBook(page, start) {
  start = start || 0;
  const url = `https://book.douban.com/subject_search?search_text=${searchText}&start=${start}`;
  console.log(url);
  const status = await page.open(url);
  const content = await page.property('content');
  const $ = cheerio.load(content);
  const item = $('.item-root .detail');
  let bookList = [];
  item.each(function () {
    const title = $(this).find('.title a').text();
    const assess = $(this).find('.rating .rating_nums').text();
    const assessNumber = getNumber($(this).find('.rating .pl').text());
    bookList.push({
      title,
      assess: parseFloat(assess || 0),
      assessNumber: parseFloat(assessNumber || 0)
    })
  });
  console.log(bookList.length);
  if (start === 0 && bookList.length > startStep) {
    bookList = bookList.slice(bookList.length - startStep);
  }
  let allList = [];
  if (start !== 0) {
    allList = await readJson();
    if (!allList) {
      allList = [];
    }
  }
  // console.log(allList);
  const newList = allList.concat(bookList);
  // console.log(newList);
  // 最多6页
  console.log(bookList.length);
  if (bookList.length === startStep && start < (7 * startStep)) {
    await logData(newList);
    await queryBook(page, start + startStep);
  } else {
    newList.sort((a, b)=>{
      return b.assessNumber - a.assessNumber;
    });
    await logData(newList);
  }
}

(async function () {
  const instance = await phantom.create();
  const page = await instance.createPage();
  // await page.on('onResourceRequested', function(requestData) {
  //   console.info('Requesting', requestData.url);
  // });
  await queryBook(page, 0);
  await instance.exit();
})();
