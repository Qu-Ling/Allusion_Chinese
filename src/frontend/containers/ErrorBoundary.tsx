import React, { useState } from 'react';
import { shell } from 'electron';
import { mapStackTrace } from 'sourcemapped-stacktrace';

import { RendererMessenger } from 'src/ipc/renderer';
import { createBugReport, githubUrl } from 'common/config';

import { useStore } from '../contexts/StoreContext';

import { Button, ButtonGroup, IconSet } from 'widgets';
import { Alert, DialogButton } from 'widgets/popovers';

export const ClearDbButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const rootStore = useStore();

  return (
    <>
      <Button
        styling="outlined"
        icon={IconSet.CLEAR_DATABASE}
        text="清除数据库"
        onClick={() => setIsOpen(!isOpen)}
      />
      <Alert
        open={isOpen}
        icon={IconSet.CLEAR_DATABASE}
        title="是否确实要清除数据库？"
        primaryButtonText="确认清除"
        onClick={async (button) => {
          if (button === DialogButton.CloseButton) {
            setIsOpen(false);
          } else {
            await rootStore.clearDatabase();
            rootStore.uiStore.closeSettings();
          }
        }}
      >
        <p>这是最后的手段. 所有导入的图片和创建的标签将被永久删除。</p>
        <p>这不会删除您系统上的图像！</p>
      </Alert>
    </>
  );
};

interface IErrorBoundaryProps {
  children: React.ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  state = {
    hasError: false,
    error: '',
  };

  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.openIssueURL = this.openIssueURL.bind(this);
  }

  componentDidCatch(error: Error) {
    // TODO: Send error to logging service
    console.error(error);

    // Map compiled error to source code
    mapStackTrace(error.stack, (sourceMappedStack: string[]) => {
      this.setState({
        error: [
          error.message,
          ...sourceMappedStack.filter((line) => !line.includes('bundle.js')),
        ].join('\n'),
      });
    });
  }

  viewInspector() {
    RendererMessenger.toggleDevTools();
  }

  reloadApplication() {
    RendererMessenger.reload();
  }

  openIssueURL() {
    const encodedBody = encodeURIComponent(
      createBugReport(this.state.error, RendererMessenger.getVersion()),
    );
    const url = `${githubUrl}/issues/new?body=${encodedBody}`;
    shell.openExternal(url);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      console.error(error);
      // You can render any custom fallback UI
      return (
        <div className="error-boundary">
          <span className="custom-icon-64">{IconSet.DB_ERROR}</span>
          <h2>出现bug的话</h2>
          <p>您可以尝试以下选项之一或联系维护者。</p>
          <ButtonGroup align="center">
            <Button
              onClick={this.reloadApplication}
              styling="outlined"
              icon={IconSet.RELOAD}
              text="Reload"
            />
            <Button
              onClick={this.viewInspector}
              styling="outlined"
              icon={IconSet.CHROME_DEVTOOLS}
              text="Toggle DevTools"
            />
            <ClearDbButton />
            <Button
              styling="outlined"
              onClick={this.openIssueURL}
              icon={IconSet.GITHUB}
              text="Create Issue"
            />
          </ButtonGroup>
          <p className="message">{error.toString()}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
