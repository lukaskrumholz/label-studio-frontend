import React from "react";
import { types, getRoot } from "mobx-state-tree";
import { observer } from "mobx-react";
import { Input } from "antd";

import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";

/**
 * Filter tag, show filter
 * @example
 * <Filter name="text-1" value="$text" />
 * @example
 * <Filter name="text-1" value="Please select the class" />
 * @name Filter
 * @param {string} value              - text of filter
 * @param {number} [size=4]           - size of filter
 * @param {string} [style]            - css style string
 * @param {boolean} [underline=false] - underline of filter
 * @param {boolean} [autofocus=false] - autofocus the element
 * @param {string} name               - name of the component
 * @param {string} nextinput          - name of the next input component (for focus)
 */

const TagAttrs = types.model({
  casesensetive: types.optional(types.boolean, false),

  cleanup: types.optional(types.boolean, true),

  placeholder: types.optional(types.string, "Quick Filter"),
  minlength: types.optional(types.string, "3"),
  hotkey: types.maybeNull(types.string),
  autofocus: types.optional(types.boolean, false),
  nextinput: types.optional(types.string, ""),
});

const Model = types
  .model({
    type: "filter",
    _value: types.maybeNull(types.string),
    name: types.maybeNull(types.string),
    toname: types.maybeNull(types.string),
    nextinput: types.maybeNull(types.string),
  })
  .views(self => ({
    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get toTag() {
      return self.completion.names.get(self.toname);
    },
  }))
  .actions(self => ({
    applyFilter() {
      let value = self._value;
      const tch = self.toTag.tiedChildren;

      if (Number(self.minlength) > value.length) {
        tch.filter(ch => !ch.visible).forEach(ch => ch.setVisible(true));
        return;
      }

      if (!self.casesensetive) value = value.toLowerCase();

      tch.forEach(ch => {
        let chval = ch._value;
        if (!self.casesensetive) chval = chval.toLowerCase();

        if (chval.indexOf(value) !== -1) ch.setVisible(true);
        else ch.setVisible(false);
      });
    },

    applyFilterEv(e) {
      let { value } = e.target;
      self._value = value;

      self.applyFilter();
      self.toTag.unselectAll();
      if (self._value) self.toTag.selectFirstVisible();
    },

    onHotKey() {
      if (self._ref) {
        self._ref.focus();
      }

      return false;
    },

    setInputRef(ref) {
      self._ref = ref;
    },

    selectFirstElement() {
      if (self._value) {
        self.toTag.selectFirstVisible();
        const selected = self.toTag.selectFirstVisible();
        if (selected && self.cleanup) {
          self._value = "";
          self.applyFilter();
          self.focusNextInput();
        }
      }
    },

    focusNextInput() {
      if (self.nextinput){
        document.getElementsByClassName(self.nextinput)[0].focus()
      }
    },

    onKeyDown(e){
      if (e.keyCode === 27){
        self._value = "";
        self.applyFilter();
        self._ref.blur();
      } else if (e.ctrlKey && e.keyCode == 13) {
        getRoot(self).submitCompletion();
      } else if (e.altKey && e.keyCode == 13) {
        getRoot(self).updateCompletion();
      } else if (e.altKey && e.keyCode == 83) {
        getRoot(self).settings.toggleFullscreen();
      }

    },
  }));

const FilterModel = types.compose("FilterModel", Model, TagAttrs, ProcessAttrsMixin);

const HtxFilter = observer(({ item }) => {
  const tag = item.toTag;

  if (tag.type.indexOf("labels") === -1 && tag.type.indexOf("choices") === -1) return null;

  return (
    <Input
      ref={ref => {
        item.setInputRef(ref);
      }}
      value={item._value}
      size="small"
      /* addonAfter={"clear"} */
      onChange={item.applyFilterEv}
      onPressEnter={item.selectFirstElement}
      placeholder={item.placeholder}
      autoFocus={item.autofocus}
      onKeyDown={item.onKeyDown}
      className={item.name}
    />
  );
});

Registry.addTag("filter", FilterModel, HtxFilter);

export { HtxFilter, FilterModel };
