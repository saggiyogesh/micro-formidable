const test = require('ava')
const listen = require('test-listen')
const formidableApi = require('./index')
const micro = require('micro')
const request = require('request-promise')
const fs = require('fs')
const {
    send
} = micro

const isPathInCwd = require('is-path-in-cwd')

const serve = (fn, options) => {
  return listen(
        micro(formidableApi(options)(fn))
    )
}

const runner = async(url) => {
  const formData = {
    testFile: fs.createReadStream(`${__dirname}/sample.png`),
    field: 'test field'
  }

  const response = await request.post({
    url,
    formData,
    json: true
  })
  return response
}

const resHandler = (req, res) => {
  send(res, 200, {
    files: req.files,
    fields: req.fields
  })
}

const basicTest = (t, response) => {
  const {
        files,
        fields
    } = response

  const file = files.testFile
  const {
        field
    } = fields

  t.true(!!file)
  t.true(!!field)

  t.deepEqual(file.name, 'sample.png')
  t.deepEqual(field, 'test field')
}

test('Upload a file', async t => {
  const url = await serve(resHandler, {})

  const response = await runner(url)
  basicTest(t, response)
})

test('Upload a file with formidable options', async t => {
  const url = await serve(resHandler, {
    uploadDir: __dirname,
    keepExtensions: true
  })

  const response = await runner(url)

  basicTest(t, response)
  const file = response.files.testFile

  t.true(isPathInCwd(file.path))
})
