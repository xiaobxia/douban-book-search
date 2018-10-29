const glob = require('glob');
const fs = require('fs-extra');

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
  const fileName = './mock/all.json';
  return fs.ensureFile(fileName).then(() => {
    return fs.writeJson(fileName, fileData, {spaces: 2})
  });
}

glob('./books/*', function (err, files) {
  if (err) done(err);
  let allBooks = [];
  files.map((filePath) => {
    let books = fs.readJsonSync(filePath);
    allBooks = allBooks.concat(books);
  });
  allBooks.sort((a, b) => {
    return b.assessNumber - a.assessNumber;
  });
  allBooks = filerList(allBooks, 'title');
  logData(allBooks);
});
