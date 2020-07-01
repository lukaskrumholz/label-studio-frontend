import React from "react";
import { Table } from "antd";
import { observer, inject } from "mobx-react";
import { types } from "mobx-state-tree";

import PDFViewer from "../../components/PDFViewer/PDFViewer";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";

/**
 * PDF tag, show PDF file in a PDFViewer
 * @example
 * <PDF name="pdf-1" value="$pdf"></Table>
 * @name PDF
 * @param {string} value
 */
const Model = types.model({
  type: "pdf",
  value: types.maybeNull(types.string),
  _value: types.optional(types.string, ""),
});

const PDFModel = types.compose("PDFModel", Model, ProcessAttrsMixin);

const HtxPDF = inject("store")(
  observer(({ store, item }) => {
    let value = item._value;

    if (!value) {
      if (store.task) value = store.task.dataObj;
    }

    return <PDFViewer src={value} />;
  }),
);

Registry.addTag("pdf", PDFModel, HtxPDF);

export { HtxPDF, PDFModel };
