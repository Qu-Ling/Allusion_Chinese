/* eslint-disable react/no-unescaped-entities */
import { observer } from 'mobx-react-lite';
import React, { memo, useCallback, useRef, useState } from 'react';

import { chromeExtensionUrl, firefoxExtensionUrl } from 'common/config';
import { clamp } from 'common/core';
import Logo_About from 'resources/images/helpcenter/logo-about-helpcenter-dark.jpg';
import { Button, ButtonGroup, IconSet, Split } from 'widgets';
import { ToolbarButton } from 'widgets/toolbar';
import ExternalLink from '../components/ExternalLink';
import PopupWindow from '../components/PopupWindow';
import { useStore } from '../contexts/StoreContext';

const HelpCenter = observer(() => {
  const { uiStore } = useStore();

  if (!uiStore.isHelpCenterOpen) {
    return null;
  }
  return (
    <PopupWindow
      onClose={uiStore.closeHelpCenter}
      windowName="help-center"
      closeOnEscape
      additionalCloseKey={uiStore.hotkeyMap.打开帮助中心}
    >
      <Documentation
        id="help-center"
        overviewId="help-center-overview"
        className={uiStore.theme}
        initPages={PAGE_DATA}
      />
    </PopupWindow>
  );
});

export default HelpCenter;

interface IDocumentation {
  id?: string;
  overviewId: string;
  className?: string;
  initPages: () => IPageData[];
}

const Documentation = ({ id, overviewId, className, initPages }: IDocumentation) => {
  const [pageIndex, setPageIndex] = useState(0);
  const pages = useRef(initPages()).current;

  const [isIndexOpen, setIndexIsOpen] = useState(true);
  const [splitPoint, setSplitPoint] = useState(224); // 14rem
  const handleMove = useCallback(
    (x: number, width: number) => {
      const minWidth = 224;
      if (isIndexOpen) {
        const w = clamp(x, minWidth, width * 0.75);
        setSplitPoint(w);

        if (x < minWidth * 0.75) {
          setIndexIsOpen(false);
        }
      } else if (x >= minWidth) {
        setIndexIsOpen(true);
      }
    },
    [isIndexOpen],
  );

  return (
    <div id={id} className={className}>
      <Split
        primary={<Overview id={overviewId} pages={pages} openPage={setPageIndex} />}
        secondary={
          <Page
            toolbar={
              <PageToolbar
                isIndexOpen={isIndexOpen}
                toggleIndex={setIndexIsOpen}
                controls={overviewId}
              />
            }
            pages={pages}
            openPage={setPageIndex}
            pageIndex={pageIndex}
          />
        }
        axis="vertical"
        align="left"
        splitPoint={splitPoint}
        isExpanded={isIndexOpen}
        onMove={handleMove}
      />
    </div>
  );
};

interface IOverview {
  id: string;
  pages: IPageData[];
  openPage: (page: number) => void;
}

const Overview = memo(function Overview({ id, pages, openPage }: IOverview) {
  return (
    <nav id={id} className="doc-overview">
      {pages.map((page, pageIndex) => (
        <details open key={page.title}>
          <summary>
            {page.icon}
            {page.title}
          </summary>
          {page.sections.map((section) => (
            <a
              key={section.title}
              href={`#${section.title.toLowerCase().replaceAll(' ', '-')}`}
              onClick={() => openPage(pageIndex)}
            >
              {section.title}
            </a>
          ))}
        </details>
      ))}
    </nav>
  );
});

interface IPage {
  toolbar: React.ReactNode;
  pages: IPageData[];
  pageIndex: number;
  openPage: (page: number) => void;
}

const Page = (props: IPage) => {
  const { toolbar, pages, pageIndex, openPage } = props;

  const buttons = [];
  if (pageIndex > 0) {
    const previousPage = () => openPage(pageIndex - 1);
    buttons.push(
      <Button key="previous" styling="outlined" onClick={previousPage} text="Previous" />,
    );
  }
  if (pageIndex < pages.length - 1) {
    const nextPage = () => openPage(pageIndex + 1);
    buttons.push(<Button key="next" styling="outlined" onClick={nextPage} text="Next" />);
  }

  return (
    <div className="doc-page">
      {toolbar}
      <article className="doc-page-content">
        {pages[pageIndex].sections.map((section) => (
          <section id={section.title.toLowerCase().replaceAll(' ', '-')} key={section.title}>
            <h2>{section.title}</h2>
            {section.content}
          </section>
        ))}
        <ButtonGroup>{buttons}</ButtonGroup>
      </article>
    </div>
  );
};

interface IPageToolbar {
  isIndexOpen: boolean;
  toggleIndex: React.Dispatch<React.SetStateAction<boolean>>;
  controls: string;
}

const PageToolbar = ({ isIndexOpen, toggleIndex, controls }: IPageToolbar) => {
  return (
    <div role="toolbar" className="doc-page-toolbar" data-compact>
      <ToolbarButton
        text="切换索引"
        icon={isIndexOpen ? IconSet.DOUBLE_CARET : IconSet.MENU_HAMBURGER}
        pressed={isIndexOpen}
        controls={controls}
        onClick={() => toggleIndex((value) => !value)}
        tabIndex={0}
      />
    </div>
  );
};

interface IPageData {
  title: string;
  icon: React.ReactNode;
  sections: { title: string; content: React.ReactNode }[];
}

const PAGE_DATA: () => IPageData[] = () => [
  {
    title: '什么是 Allusion',
    icon: IconSet.LOGO,
    sections: [
      {
        title: 'Allusion介绍',
        content: (
          <>
            <img className="centered" src={Logo_About} alt="Logo" />
            <p>
              <strong>
                Allusion 是一种旨在帮助艺术家组织他们的视觉库的工具。
                对于有创造力的人来说，在整个项目中使用参考图像是很常见的。
              </strong>
            </p>
            <p>
              通过使用互联网技术，找到此类图像变得相对容易。另一方面，管理此类图像仍然是一个挑战。显然，重要的不是我们可以存储多少图像，而是我们可以有效访问什么的问题。如果只有少数图像与我们相关，那么很容易记住它们，但许多艺术家对创建自己的策展图书馆感兴趣，因此，记住图像的位置变得越来越困难。同样，Allusion
              的创建是为了帮助艺术家组织他们的视觉库。要了解有关 Allusion
              工作原理的更多信息，请继续阅读。
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: '设置库',
    icon: IconSet.META_INFO,
    sections: [
      {
        title: '开始',
        content: (
          <>
            <p>
              库设置是指将图像导入Allusion以便进行管理和查看的操作。
              与直接从本地文件系统手动导入不同，Allusion采用链接文件夹机制——我们称之为<b>位置</b>。
              继续阅读以了解如何向Allusion库添加图像。
            </p>
          </>
        ),
      },
      {
        title: '位置',
        content: (
          <>
            <p>
              在Allusion中，向库添加图像的核心方式是使用"位置"功能。此处所指的"位置"即为您计算机上的文件夹链接。该机制可自动加载所选文件夹内所有图像及嵌套子文件夹内容，实现一键式批量管理。
              <br />
              <br />
              此系统的核心优势在于：既保留您对数据存储路径的完全掌控权，又免除了反复手动导入的繁琐操作。新增图像时只需将其放入已链接文件夹，Allusion即会实时同步显示最新内容
              <br />
              <br />
              需要注意的是：若从链接文件夹中移除图像，Allusion不会自动执行删除操作。这是为了防止误删或移动文件时丢失已标注的标签数据。当需要彻底删除图像时，可通过"缺失图像"视图定位目标文件，点击工具栏删除按钮进行确认操作。若为误操作，只需将文件还原至原路径即可触发自动重新识别。
              <br />
              <br />
              在单个位置范围内，您可自由重命名文件或调整文件夹内部结构，Allusion将在重启应用后自动感知变更并更新显示状态。
            </p>
            <p>
              添加新位置：进入大纲视图后，将鼠标悬停在位置标题栏。右侧会显示"+"图标，点击进入文件夹选择界面。选定包含图像的目录后，需在弹出窗口中确认路径并设置位置参数。此时可选择"排除子文件夹"选项（后续仍可修改此设置，但需注意：Allusion不会为排除的子文件夹存储标签数据，已存在的标签信息将在执行排除操作时被清除）。确认配置后，图像资源将即时呈现在内容工作区。
            </p>
            <p>
              移除位置：在大纲视图中右键单击目标位置，通过上下文菜单选择"删除"即可。需注意的是：此操作将永久清除与该位置关联的所有图像标签数据，但原始文件仍会保留在您的文件系统中。
            </p>
          </>
        ),
      },
      {
        title: '拖拽放置',
        content: (
          <>
            <p>
              另一种快速导入图像的方法是将它们拖到您的位置。您可以从文件资源管理器中拖动它们，
              但也来自任何其他来源，例如Web浏览器。放置这些图像时，它们将被复制到您选择的(子)文件夹中。
            </p>
          </>
        ),
      },
      {
        title: '浏览器扩展',
        content: (
          <>
            <p>
              已为Firefox及基于Chromium内核的浏览器（如Google Chrome、Microsoft
              Edge）开发了专用扩展程序，支持直接通过浏览器将图片导入Allusion平台并即时完成标签标注。具体操作指引请查阅设置窗口中的「后台进程」板块。
              <br />
              扩展程序获取方式： <ExternalLink url={chromeExtensionUrl}>谷歌浏览器</ExternalLink>
              或者 或者 <ExternalLink url={firefoxExtensionUrl}>火狐浏览器</ExternalLink>.
            </p>
          </>
        ),
      },
      {
        title: '标签导入/导出',
        content: (
          <>
            <p>
              您可将Allusion内部数据库中的标签信息持久化存储至图像文件元数据中。
              这意味着即可在其他应用程序(如文件管理器,AdobeBridge等设计工具)中直接调用这些标签。相关功能位于设置窗口的「导入/导出」模块。
              <br />
              请注意，上述操作仅会影响画廊中展示的图片！
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: '添加标签',
    icon: IconSet.TAG,
    sections: [
      {
        title: '标签设置',
        content: (
          <>
            <p>
              在大纲视图中，建议提前规划实用标签体系以充分发挥其结构化管理优势。您的标签管理系统位于大纲视图左边的「标签」功能区，支持创建、编辑和多维组织标签资产。
            </p>
            <p>点击标题栏右侧的【+】按钮即可新增标签（需鼠标悬停激活按钮）</p>
            <p>
              通过拖拽标签即可调整其在「标签」功能区的位置，并且可以将一个标签拖拽到另一个标签上，使该标签可以成为另一个标签的子级。
              标签可以自由排列形成树状结构，实现标签的立体化分类
            </p>
            <p>右键单击目标标签即可通过上下文菜单进行编辑/删除操作</p>
          </>
        ),
      },
      {
        title: '如何为图像添加标签',
        content: (
          <>
            <p>
              有几种方法可以标记图像。
              1.您可以从「标签」功能区中拖动标签到图像上。这也适用于选择多个图像后拖动添加标签。
              2.您可以选择图像，按T打开标签编辑器，然后在列表中分配或删除标签，此方法也允许您选择多个图像后进行标记。
              3.您在全尺寸查看图像时，可以通过将标签添加到检查器面板（右侧的侧边栏）中来添加标签。
            </p>
            <p>
              要从一张或多张图像中移除标签时，您需要访问标签编辑器或检查器面板。在这两个位置，您都可以删除单个标签或清除所选图像上的全部标签。
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: '搜索',
    icon: IconSet.SEARCH,
    sections: [
      {
        title: '快速搜索',
        content: (
          <>
            <p>
              在Allusion中，您可以通过多种方式查找特定图片。
              <br />
              默认情况下，搜索栏会根据图片的标签进行检索。按Ctrl+F键可快速聚焦到搜索栏。
              <br />
              高级搜索功能可通过Allusion 右上角的三点图标进入。
            </p>
            <p>
              工具栏中始终可见的「标签」是最快速的检索方式。点击单个标签右边的“放大镜”按钮即可找出含有该标签的图片。
              也可以按住ctrl键点击多个标签的放大镜来找出同时包含选中标签的所有图片。
              <br />
              使用搜索栏筛选时，Allusion会基于父标签提供建议（同时显示其父标签）。从列表中选择项目即可将其加入搜索条件。
              <br />
              点击搜索栏右侧的**两个圆形图标**，可切换为返回**包含任意一个选中标签**的图片。
              <br />
              此外，Allusion 默认会递归搜索子标签​（例如搜索 `#人物` 时会自动包含 `#男生`、`#女生`
              等子标签）。若需排除子标签，可使用高级搜索功能手动设置。
            </p>
          </>
        ),
      },
      {
        title: '高级搜索',
        content: (
          <>
            <p>
              在 Allusion 中，您可以通过以下方式打开高级搜索功能：
              <br /> 1. 点击右上角的三点图标；
              <br /> 2.使用快捷键 `Ctrl-Shift-F`。
              <br />
              在该窗口中，您可以通过条件构建器自由创建任意数量的搜索条件。具体操作如下：
              <br />
              在「条件构建器」区域输入您的搜索条件； <br />
              点击右侧的「加号」图标，将完成的条件添加到下方的「查询编辑器」中；
              <br />
              点击「搜索」按钮后，系统将返回完全匹配「查询编辑器」中所有条件的图片，而非仅匹配「条件构建器」中的内容。
            </p>
            <p>
              详细说明：界面中的每一行代表一个独立的搜索条件，包含三个输入字段：
              <ol>
                <li>
                  条件类型：选择要搜索的内容类型（如标签、文件属性。支持的文件属性包括文件名、大小、类型及创建日期等。
                </li>
                <li>逻辑：从下拉菜单中选择逻辑关系，例如：包含、不包含、递归包含、递归不包含。</li>
                <li>值：输入您希望匹配的具体值。</li>
              </ol>
              <strong>提示：</strong> 添加多个条件可进一步缩小搜索范围。
            </p>
            <p>
              ​多查询控制功能： 当输入两个及以上查询时，您可以在以下位置切换匹配模式：
              <br /> 1.高级搜索面板底部的「切换按钮」；
              <br /> 2. 搜索栏右侧的「且或」图标（两个圆形交叉）。
              <br />
              两种模式分别为
              <br />
              全部匹配（且）：仅返回同时满足所有查询条件的图片。 ​<br />
              任意匹配（或）：只要满足其中一个查询条件即被检索。
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: '检查',
    icon: IconSet.INFO,
    sections: [
      {
        title: '画廊区域',
        content: (
          <>
            <p>
              画廊区域是窗口中央显示图片的列表区域。您可以通过工具栏中的偏好设置来控制图片的展示方式：
              <br />
              1.​视图模式切换：点击工具栏的下拉菜单（四个方块）选择预设视图模式；也可以使用快捷键alt+1、2、3、4切换视图。
              或在任何位置右键单击画廊区域，从弹出菜单中选择。 ​<br />
              2.自定义排序：点击工具栏的下拉菜单（两个三角）选择排序方式，或在任何位置右键单击画廊区域，从弹出菜单中选择。选择两次同样条件可进行倒序。
              支持按文件名、创建日期、文件大小等多种属性对图片进行排序。
              <br />
              3.缩略图尺寸调整：​视图模式菜单中修改缩略图显示大小。
            </p>
          </>
        ),
      },
      {
        title: '图像详情',
        content: (
          <>
            <p>
              每张图片都包含文件名、URL、尺寸等信息。您可以通过检查器面板查看这些元数据及已分配的标签。
              <br />
              打开检查器的方式：右键单击图片 → 选择「以全尺寸查看」；
              或直接双击图片进入全尺寸查看模式（检查器会自动显示）。
              <br />
              <strong>若检查器未显示：</strong>
              在工具栏中找到「信息」图标（通常为放大镜或 `i` 图标）即可调出。
            </p>
          </>
        ),
      },
      {
        title: '独立预览窗口',
        content: (
          <>
            <p>
              您还可以通过以下方式在独立窗口中预览图片：
              <br /> ​选择图片 → 按下 `空格键`打开预览窗口，再次按`空格键`可关闭窗口。
              <br />
              <br />
              预览窗口：仅支持循环播放已选图片​（需提前多选）；
              <strong>注意：</strong> 预览窗口中无法浏览非选中图片，需重新选择新图片集进行预览。
            </p>
          </>
        ),
      },
    ],
  },
];
