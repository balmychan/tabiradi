chai = require('chai')
expect = chai.expect
chai.should()

WebRadiconServer = require("../src/WebRadiconServer")

describe 'Controller', ->
  controllerPort = 18080
  arduinoPort = 13000
  ip = "127.0.0.1"
  webRadiconServer = null

  before ->
    webRadiconServer = WebRadiconServer.createServer()
    webRadiconServer.listen
      controllerPort: controllerPort
      arduinoPort: arduinoPort
      ip: ip


  it "webRadiconServer should has no Aruduino", ->
    webRadiconServer.hasArduino().should.equal(false)
