async = require 'async'
xml2js = require 'xml2js'
_ = require 'underscore'
gameLog = console
readFile = require("fs").readFile

class WrapData
  constructor: (@data_,@dataTable_)->
  ref: (key)->
    @dataTable_.ref @data_,key

  refWrap: (key)->
    @dataTable_.refWrap @data_,key

  @data_
  @dataTable_

class DataTable 
  constructor: (@dataMgr_)->
    @config_ = null

  loadFromFile: (file,config,callback)->
    @setConfig config
    @parserXml file,(err,result)=>
      if err?
        callback err,null
      else 
        row = result.root.row
        if !(_.isArray row)
          temp = row
          row = [temp]
        @dataToNumber row
        @data_ = @rowIdTransform row
        if @config_? and @config_.arrayList?
          @objectToArray @data_,@config_.arrayList
        callback null,@data_
        #@additionXml(callback)
  
  dataToNumber: (rowTable)->
    numberReg = `/^-?\d+(\.\d+)?$/`
    for row in rowTable
      for k, v of row
        if _.isObject v
          for k1, v1 of v
            if numberReg.test v1
              v[k1] = parseFloat v1
        else if numberReg.test v
          row[k] = parseFloat v

  rowIdTransform: (arr)->
    resultArr = []
    for value in arr
      resultArr[value.resId] = value
    return resultArr

  setConfig: (@config_ = null)->
    if @config_? and @config_.refList?
      @refList_ = @config_.refList
      delete @config_.refList

  parserXml: (fileName,fn)->
    xmlParser = new xml2js.Parser ignoreAttrs: true,explicitArray: false
    async.waterfall [
      (callback)->
        readFile fileName,(err,data)->  
          callback err,data
        return
      ,(data,callback)=>
        xmlParser.parseString data,(err,result)->   
          callback err,result
          fn err,result
          return
        return
      ],(err,result)->
        gameLog.error err if err?
        return
    return

  find: (id)->
    if @data_[id]?
      return @data_[id]
    return null

  findWrap: (id)->
    data = @find id
    if data?
      return new WrapData data,@
    return null

  ref: (data,key)->
    value = data[key]
    tableName = @getRefTableName key
    if tableName?
      if _.isString value
        return @dataMgr_.find tableName,value
      else if _.isArray value
        resultArray = []
        for v,i in value
          resultArray[i] = @dataMgr_.find tableName,v
        return resultArray
    return null

  refWrap: (data,key)->
    value = data[key]
    tableName = @getRefTableName key
    if tableName?
      if _.isString value
        return @dataMgr_.findWrap tableName,value
      else if _.isArray value
        resultArray = []
        for v,i in value
          resultArray[i] = @dataMgr_.findWrap tableName,v
        return resultArray
    return null

  getRefTableName: (key)->
    for k, v of @refList_
      if key is k
        return v
    return null  
    

  objectToArray: (data,arrayList)->
    singleDataSet = (key,max,force,singleData)->
      keyArray = []
      for index in [0..max]
        indexValue = singleData[key + index]
        if indexValue? 
          if !((_.isObject indexValue) and _.isEmpty indexValue)
            keyArray.push indexValue
          delete singleData[key + index]
        else if !force
          break
        else if force
          keyArray.push undefined
      singleData[key] = keyArray
    if _.isArray arrayList
      for arr in arrayList
        key = arr.key
        max = arr.max
        force = arr.force ? false
        if (_.isString key) and _.isNumber max
          for singleData in data
            if singleData?
              singleDataSet key,max,force,singleData
    else if _.isObject arrayList
      key = arrayList.key
      max = arrayList.max
      force = arrayList.force ? false
      if (_.isString key) and (_.isNumber max)
        for singleData in data
          if singleData?
            singleDataSet key,max,force,singleData

    return

  additionXml: (callback)->
    if @config_?
      xmlList = @config_.xmlList
      if _.isArray xmlList
        for singleData in @data_
          for xml in xmlList
            xmlKey = xml.xmlKey
            arrayList = xml.arrayList
            if not xmlKey
              continue
            filename = singleData[xmlKey]
            if filename?
              do (singleData,xml,arrayList)=>
                @parserXml filename,(err,result)->
                  if err?
                    callback err,null
                  else
                    xmlData = @rowIdTransform result.row
                    if arrayList?
                      @objectToArray xmlData,arrayList
                    singleData[xml] = xmlData
                    callback null,null
                    return
                  return
      else
        callback null,null  
    else
      callback null,null  
    return

  @config_
  @data_
  @refList_
  @dataMgr_

module.exports = DataTable
