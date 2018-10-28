const cheerio = require('cheerio');
const phantom = require('phantom');
const fs = require('fs-extra');

const searchText = encodeURI('文化');
//豆瓣是20
const startStep = 20;

function filerList(list, key) {
  let keyList = [];
  let newList = [];
  for (let i = 0; i < list.length; i++) {
    let item = list[i];
    if (keyList.indexOf(item.title) === -1) {
      newList.push(item);
      keyList.push(item.title);
    }
  }
  return newList;
}

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

function formatTitle(str) {
  let newStr = str.replace(/\n/g, '');
  return newStr.replace(/\s*/g, "");
}

async function queryBook(page, start) {
  start = start || 0;
  const url = `https://book.douban.com/tag/${searchText}?type=T&start=${start}`;
  console.log(url);
  const status = await page.open(url);
  const content = await page.property('content');
  const $ = cheerio.load(content);
  const item = $('.subject-list .subject-item');
  let bookList = [];
  item.each(function () {
    const title = $(this).find('.info h2 a').text();
    const assess = $(this).find('.star .rating_nums').text();
    const assessNumber = getNumber($(this).find('.star .pl').text());
    bookList.push({
      title: formatTitle(title),
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
  let newList = allList.concat(bookList);
  // console.log(newList);
  // 最多6页
  console.log(bookList.length);
  if (start < (20 * startStep)) {
    await logData(newList);
    await queryBook(page, start + startStep);
  } else {
    newList.sort((a, b) => {
      return b.assessNumber - a.assessNumber;
    });
    newList = filerList(newList, 'title');
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
