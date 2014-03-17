async = require 'async'
xml2js = require 'xml2js'
EventEmitter = require('events').EventEmitter 
dataFiles = require "./serverDataFiles"
_ = require 'underscore'
DataTable = require "./xmlDataTable"
jf = require "jsonfile"
gameLog = console
_path = require "path"
jf.spaces = 1;

dataKey = 
  roleAttr : "roleAttr"
  mapInfo: "mapInfo"
  itemTable: "itemTable"
  baseOdds: "baseOdds"
  chapter: "chapter"
  monster: "monster"
  monsterPack: "monsterPack"
  skillTable: "skillTable"
  taskTable: "taskTable"

class DataMgr extends EventEmitter
  DataMgr.haveKey = (data,key)->
    value = data[key]
    return value? and value is 1

  constructor: ->
    @dataTables_ = {}
    @dataFileTables_ = {}
  
  loadFiles: ->
    if dataFiles
      path = dataFiles.path
      files = dataFiles.files
      parcallarr = []
      for name,config of files
        fileName = path + config.file
        callback_ = do (name,fileName,config)=>
          return (callback)=>
            dataTable = new DataTable @
            dataTable.loadFromFile fileName,config,(err,result)=>
              if not err
                @dataTables_[name] = dataTable
                @dataFileTables_[dataTable.config_.file] = dataTable.data_
              callback err,result
        parcallarr.push callback_
      async.parallel parcallarr,(err,results)=>
        if err
          gameLog.error err
        else
          gameLog.info "服务器数据加载完毕!"
          @writeJson()
          @emit "fileDone"
    else
      gameLog.error "服务器数据配置文件读取失败!"
  

  find: (name,id)->
    dataTable = @dataTables_[name]
    if dataTable?
      return dataTable.find id
    return null
  
  findWrap: (name,id)->
    dataTable = @dataTables_[name]
    if dataTable?
      return dataTable.find id
    return null    
  writeJson: ->
    for name,data of @dataFileTables_
      path = "../" + (_path.basename name,".xml") + ".json"
      jf.writeFileSync path,data 
    
  @dataTables_
  @dataFileTables_

dataMgr = new DataMgr
module.exports.dataMgr = dataMgr
module.exports.dataKey = dataKey