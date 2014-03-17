util = require "util"
dataMgr = require("./xmlDataMgr").dataMgr
dataMgr.loadFiles()
dataMgr.on "fileDone",->
  process.exit 0