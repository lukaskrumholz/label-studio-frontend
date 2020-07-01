import React from 'react';
import { observer } from "mobx-react";


class PDFJs {
  init = (source, element) => {
    const iframe = document.createElement('iframe');

    iframe.src = `/pdfjs-2.4.456-dist/web/viewer.html?file=${source}`;
    iframe.width = '100%';
    iframe.height = '100%';

    element.appendChild(iframe);
  }
}

export default observer(
  class PDFViewer extends React.Component {

    constructor(props) {
      super(props);
      this.viewerRef = React.createRef();
      this.backend = new PDFJs();
    }

    componentDidMount() {
      const { src } = this.props;
      const element = this.viewerRef.current;

      this.backend.init(src, element);
    }

    render() {
      return (
        <div ref={this.viewerRef} id='pdf-viewer' style={{ width: '100%', height: '100%' }}>

        </div>
      )
    }
  }
);