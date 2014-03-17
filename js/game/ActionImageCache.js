(function(BTG) {
	BTG.RenderTexture = function() {
		this.memorySize = 0;
		this.renderTexture = null;
		this.texRectArray = null;
		this.szEq6Array = "";
		this.refCount = 0;
	};

	BTG.ActionImageCache = function() {
		this.m_pTexCache = new Object;
		this.m_memoryBufCurSize = 0;
		this.m_memoryBufMaxSize = 1024 * 1024 * 5; //5M
	};
	BTG.ActionImageCache.cacheTextureCount = 6;
	BTG.ActionImageCache.prototype.find = function (resId, szEqList6) {
		if (this.m_pTexCache[resId] === undefined)
			return null;
		if (this.m_pTexCache[resId][szEqList6] === undefined)
			return null;
		return this.m_pTexCache[resId][szEqList6];
	}
	BTG.ActionImageCache.prototype.add = function (resId, eqList6, renderObj) {
		var szEqList6 = eqList6.toString();
		var pRenderTex = this.find(resId, szEqList6);
		if (pRenderTex) {
			pRenderTex.refCount++;
			return pRenderTex;
		}

		if (this.m_pTexCache[resId] === undefined) {
			this.m_pTexCache[resId] = new Object();
		}
		pRenderTex = new BTG.RenderTexture();
		pRenderTex.refCount++;
		this.m_pTexCache[resId][szEqList6] = pRenderTex;

		// renderToTexture
		var aabbBox = renderObj.cacheGetBoundBox(); //cc.RenderTexture.create(1024, 1024);//
		var pixelWH = cc.size(aabbBox.size.width * BTG.ActionImageCache.cacheTextureCount, aabbBox.size.height);
		pRenderTex.renderTexture = cc.RenderTexture.create(pixelWH.width, pixelWH.height);
		//
		//var pixels = pRenderTex.renderTexture.context.getImageData(0, 0, pixelWH.width, pixelWH.height);
		//var pData = pixels.data;
		//
		pRenderTex.renderTexture.getSprite().setAnchorPoint(cc.p(0.0, 0.0));
		//pRenderTex.renderTexture.setPosition(cc.p(0, 0));
		pRenderTex.renderTexture.setAnchorPoint(cc.p(0.0, 0.0));

		pRenderTex.texRectArray = new Array(BTG.ActionImageCache.cacheTextureCount);
		pRenderTex.memorySize = aabbBox.size.width * BTG.ActionImageCache.cacheTextureCount * aabbBox.size.height * 4;
		this.m_memoryBufCurSize += pRenderTex.memorySize;

		if (cc.renderContextType === cc.CANVAS) {
			// render outScene to its texturebuffer
			pRenderTex.renderTexture.clear();

		} else {
			// render outScene to its texturebuffer
			pRenderTex.renderTexture.clear(0, 0, 0, 0);
			pRenderTex.renderTexture.begin();
		}

		for (var i = 0; i < BTG.ActionImageCache.cacheTextureCount; i++) {
			renderObj.cacheRenderTo(cc.p(i * aabbBox.size.width, 0), i, pRenderTex.renderTexture.context);
			pRenderTex.texRectArray[i] = cc.rect(i * aabbBox.size.width, 0, aabbBox.size.width - 1, aabbBox.size.height - 1);
		}
		if (cc.renderContextType !== cc.CANVAS) {
			pRenderTex.renderTexture.end();
		}
		
		if (this.m_memoryBufCurSize >= this.m_memoryBufMaxSize) {
			for (var pResId in this.m_pTexCache) {
				for (var pEq in this.m_pTexCache[pResId]) {
					if (this.m_pTexCache[pResId][pEq].refCount <= 0) {
						this.m_memoryBufCurSize -= p.memorySize;
						this.m_pTexCache[pResId][pEq].renderTexture = 0;
						delete this.m_pTexCache[pResId][pEq];
					}
				}
			}
		}
		return pRenderTex;
	}
	BTG.ActionImageCache.prototype.del = function (resId, eqList6) {
		var szEqList6 = eqList6.toString();
		var pRenderTex = this.find(resId, szEqList6);
		pRenderTex.refCount--;
	}
})(BTG);