import React from "react";
import { Checkbox, Radio, Form, Tag } from "antd";
import { observer, inject } from "mobx-react";
import { types, getParentOfType, getRoot } from "mobx-state-tree";

import Hint from "../../components/Hint/Hint";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Tree from "../../core/Tree";
import Utils from "../../utils";

import { ChoicesModel } from "./Choices";

/**
 * Choice tag represents a single choice
 *
 * @example
 * <View>
 *   <Choices name="gender" toName="txt-1" choice="single">
 *     <Choice value="Male" />
 *     <Choice value="Female" />
 *   </Choices>
 *   <Text name="txt-1" value="John went to see Marry" />
 * </View>
 * @name Choice
 * @param {string} value            - choice value
 * @param {boolean} [selected]      - if this label should be preselected
 * @param {string} [alias]          - alias for the label
 * @param {style} [style]           - css style of the checkbox element
 * @param {string} [hotkey]         - hotkey
 * @param {boolean} [disablehotkey] - disable hotkey
 */
const TagAttrs = types.model({
  selected: types.optional(types.boolean, false),
  alias: types.maybeNull(types.string),
  value: types.maybeNull(types.string),
  hotkey: types.maybeNull(types.string),
  style: types.maybeNull(types.string),
  disablehotkey: types.optional(types.boolean, false)
});

const Model = types
  .model({
    type: "choice",
    visible: types.optional(types.boolean, true),
    _value: types.optional(types.string, ""),
  })
  .views(self => ({
    get isCheckbox() {
      const choice = self.parent.choice;
      return choice === "multiple" || choice === "single";
    },

    get isLabel() {
      const choice = self.parent.choice;
      return choice === "label";
    },

    get completion() {
      return getRoot(self).completionStore.selected;
    },

    get parent() {
      return getParentOfType(self, ChoicesModel);
    },
  }))
  .actions(self => ({
    toggleSelected() {
      const choices = self.parent;

      choices.shouldBeUnselected && choices.unselectAll();

      self.setSelected(!self.selected);

      const reg = self.completion.highlightedNode;

      // if (reg) {
      //     const sel = self.parent.selectedLabels;
      //     if (sel.length === 1 && sel[0]._value === self._value) return;
      // }

      // choice is toggled, we need to check if we need to update
      // the currently selected region
      if (reg && choices.perregion && reg.parent.name === choices.toname) {
        reg.updateOrAddState(choices);
      }
    },

    setVisible(val) {
      self.visible = val;
    },

    setSelected(val) {
      self.selected = val;
    },

    onHotKey() {
      if (!self.disablehotkey) {
        return self.toggleSelected();
      } else {
        return;
      }
    },
  }));

const ChoiceModel = types.compose("ChoiceModel", TagAttrs, Model, ProcessAttrsMixin);

const HtxChoice = inject("store")(
  observer(({ item, store }) => {
    let style = {};

    if (item.style) style = Tree.cssConverter(item.style);

    if (!item.visible) {
      style["display"] = "none";
    }

    if (item.isCheckbox) {
      const cStyle = Object.assign({ display: "flex", alignItems: "center", marginBottom: 0 }, style);

      return (
        <Form.Item style={cStyle}>
          <Checkbox
            disabled={item.parent.readonly}
            name={item._value}
            onChange={ev => {
              if (!item.completion.editable) return;
              item.toggleSelected();
              ev.nativeEvent.target.blur();
            }}
            checked={item.selected}
          >
            {item._value}
            {store.settings.enableTooltips && store.settings.enableHotkeys && item.hotkey && !item.disablehotkey && (
              <Hint>[{item.hotkey}]</Hint>
            )}
          </Checkbox>
        </Form.Item>
      );
    } else if (item.isLabel){
      const cStyle = Object.assign({ display: "flex", alignItems: "center", marginBottom: 0 }, style);

      const bg = item.background;
      const labelStyle = {
        backgroundColor: item.selected ? "#b7eb8f" : "#e8e8e8",
        color: item.selected ? item.selectedcolor : "#333333",
        cursor: "pointer",
        margin: "5px",
      };

      return (
        <Form.Item style={cStyle}>
          <Tag
            onClick={ev => {
              item.toggleSelected();
              return false;
            }}
            style={labelStyle}
            size={item.size}
          >
            {item._value}
            {item.showalias === true && item.alias && (
              <span style={Utils.styleToProp(item.aliasstyle)}>&nbsp;{item.alias}</span>
            )}
            {(store.settings.enableTooltips || store.settings.enableLabelTooltips) &&
              store.settings.enableHotkeys && !item.disablehotkey &&
              item.hotkey && <Hint>[{item.hotkey}]</Hint>}
          </Tag>
        </Form.Item>
      );
    } else {
      return (
        <div style={style}>
          <Radio
            disabled={item.parent.readonly}
            value={item._value}
            style={{ display: "inline-block", marginBottom: "0.5em" }}
            checked={item.selected}
            onChange={ev => {
              if (!item.completion.editable) return;
              item.toggleSelected();
              ev.nativeEvent.target.blur();
            }}
          >
            {item._value}
            {(store.settings.enableTooltips || store.settings.enableLabelTooltips) &&
              store.settings.enableHotkeys && !item.disablehotkey &&
              item.hotkey && <Hint>[{item.hotkey}]</Hint>}
          </Radio>
        </div>
      );
    }
  }),
);

Registry.addTag("choice", ChoiceModel, HtxChoice);

export { HtxChoice, ChoiceModel };
