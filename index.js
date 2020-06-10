"use strict";
const fs         = require("fs")
const util       = require("util")
const fsreadFile = util.promisify(fs.readFile);
const fsstat     = util.promisify(fs.stat)
const hjson      = require("hjson")
const macache    = require('./lib/mcache.js')
const file_ttl   = 30 * 60   // 30 minutes

async function _fnUseCache(filename,options)
{
try { 
    let stats  = await fsstat(filename)
    let mtime = stats.mtimeMs
    let cachekey = "file:" + filename
    let _filecache = macache.get(cachekey)

    if (typeof(_filecache) != "undefined")
       {
         if (mtime == _filecache.mtime)
            {
              return true
            }
       }
       // key, value, ttl [optional]
    macache.set (cachekey, {"mtime":mtime}, file_ttl)
    return false
  }
  catch (err)
    {
      console.log ("Error:", err);
      throw new Error(err)       
    }
}

macache.readFile = async function (filename, options)
{
    let cachekey = "file:" + filename
    let _filecache = undefined
    let bUseCache  = undefined
    try {
    bUseCache = await (_fnUseCache(filename, options))  // ENOENT  -- file not found
    }
    catch (err) {
      throw new Error(err)       
    }
    _filecache = macache.get(cachekey)

    if (bUseCache == "ENOENT")
       {
           return bUseCache
       }
    else 
    {      
    let isCache = false
    if (!bUseCache)
       {
        let fdata = await fsreadFile(filename)
        let cachedata = fdata.toString()
        if (options)  
           {

               if (options.type && (options.type.includes("json"))
                  )       
                  {
                    if (options.type == "hjson")
                    {
                     cachedata = hjson.parse(cachedata)
                    }
                    else if (options.type == "json")
                    {
                     cachedata = JSON.parse(cachedata)
                    }
                  }
           }
        _filecache.content = cachedata
       }   
    else {
          isCache = true
        }
     return {"isCache":isCache,"data":_filecache}   
    }  
}

module.exports = macache


