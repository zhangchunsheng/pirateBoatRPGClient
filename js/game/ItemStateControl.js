(function(BTG) {
	BTG.ItemStateControl = function () {
		this.m_items = [];
		this.m_currentItem = null;
		this.m_activeSpr = null;
		this.m_disableSpr = null;
	}
	BTG.ItemStateControl.prototype.setItems = function (items) {
		this.m_items = items;
		for (var i = 0; i < items.length; i++)
		items[i]._currentState = itemStateMode_Normal;
	}
	BTG.ItemStateControl.prototype.addItem = function (item) {
		this.m_items.push(item);
	}
	BTG.ItemStateControl.prototype.setItemStateByIdx = function (idx, state) {
		var item = this.m_items[idx];
		if (item)
			this.setItemState(item, state);
	}
	BTG.ItemStateControl.prototype.setItemState = function (item, state) {
		// if (item._currentState === state) return;
		item._currentState = state;

		if (item._currentStateSpr) {
			item._currentStateSpr.setVisible(false);
			item._currentStateSpr = null;
		}
		if (state === itemStateMode_Normal) {
			return;
		} else if (state === itemStateMode_Active) {
			if (this.m_activeSpr) {
				if (this.m_currentItem) this.m_currentItem._currentState = itemStateMode_Normal;
				this.m_activeSpr.setPosition(item.getPosition());
				item._currentStateSpr = this.m_activeSpr;
				this.m_currentItem = item;
			} else if (item._activeSpr) {
				item._currentStateSpr = item._activeSpr;
			}
		} else if (state === itemStateMode_Disable) {
			if (this.m_disableSpr) {
				this.m_disableSpr.setPosition(item.getPosition());
				item._currentStateSpr = this.m_disableSpr;
			} else if (item._disableSpr) {
				item._currentStateSpr = item._disableSpr;
			}
		}
		if (item._currentStateSpr) {
			item._currentStateSpr.setVisible(true);
		}
	}
	BTG.ItemStateControl.prototype.enableShareState = function (activeSpr, disableSpr) {
		if (activeSpr) {
			this.m_activeSpr = activeSpr;
			activeSpr.setZOrder(BTG.GZOrder_Top)
		}
		if (disableSpr) {
			this.m_disableSpr = disableSpr;
			activeSpr.setZOrder(BTG.GZOrder_Top)
		}
	}
	BTG.ItemStateControl.prototype.resetItemsState = function () {
		for (var i = 0; i < this.m_items.length; i++) {
			var item = this.m_items[i];
			item._currentState = itemStateMode_Normal;
			if (item._currentStateSpr) {
				item._currentStateSpr.setVisible(false);
				item._currentStateSpr = null;
			}
		}
	}
})(BTG);