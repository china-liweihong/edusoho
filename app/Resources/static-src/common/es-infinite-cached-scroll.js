import ESInfiniteScroll from 'common/es-infinite-scroll';
import 'waypoints/lib/jquery.waypoints.min';
import Emitter from "common/es-event-emitter";

/** 
 * 伪分页，从缓存中读取数据，数据结构格式见 构造方法
 *   例子见 app/Resources/static-src/app/js/courseset/show/index.js
 *     及 app/Resources/views/course/task-list/default-task-list.html.twig
 * 
     <!-- 
      模板, 有class js-infinite-item-template
        1. 变量以 {chapterName} 的方式生成，chapterName是变量，会先从 context 中找chapterName方法(参数当前行data和context),
        如果没有此方法，则去data中找到相应属性
        2. display-if 如果结果为0或false, 则删除该节点
        3. hide-if 如果结果为1或true, 则删除该节点
        4. tmp节点，会将tmp节点删除掉，但是tmp内的内容不会被删除
     -->
     <div class="js-infinite-item-template hidden">
      <li class="task-item bg-gray-lighter js-task-chapter infinite-item" 
          display-if="{isChapter}"><i class="es-icon es-icon-menu left-menu"></i>
        <a href="javascript:" class="title gray-dark">{chapterName}</a>
        <i class="right-menu es-icon es-icon-remove js-remove-icon"></i>
      </li>
    </div>

     <!-- 
       容器, 有class infinite-container, 
       根据所给的值，会将模板内的节点生成并显示到容器内（不包含js-infinite-item-template节点本身）
     -->
     <ul class="task-list task-list-md task-list-hover infinite-container">
     </ul>

     <!-- 当页面上看到此节点时，会自动显示下一页 -->
     <div class="js-down-loading-more" style="min-height: 1px"></div>
 */
let current;

export default class ESInfiniteCachedScroll extends Emitter {
  /**
   * @param options  
   *  {
   *    'data': eval($('.infiniteScrollDataJson').val()),  
          //json数组
            [
              {
                'itemType': 'chapter',
              },
              {
                'itemType': 'unit',
              }
            ]
   *    'context': jsonData,
          //json, 用于将data中的值做转换
          // 支持普通数组和方法
          {
            'course': {
              'id': 1,
              'isFree': 'true'
            },
            'isChapter': function(data, context) {
              return 'chapter' == data.itemType;
            },
          }
   *    'dataTemplateNode': '.infiniteScrollTemplate',  
   *       //会通过 $(dataTemplateNode)来找到模板, 模板格式为
            <div class="js-infinite-item-template hidden">  # 本行必须
              <i class="es-icon es-icon-undone-check color-{color} left-menu"></i> ## 实际显示的节点
            </div>
   *  }
   */
  constructor(options) {
    super();
    current = this;

    this._options = options;
    this._initConfig();
    this._displayData();

    this._initUpLoading();
  }

  _initUpLoading() {
    // 滚动到 class='js-down-loading-more' 的dom节点时，自动刷新下一页
    let waypoint = new Waypoint({
      element: $('.js-down-loading-more')[0],
      handler: function(direction) {
        if (direction == 'down') {
          if (current._isLastPage) {
            waypoint.disable();
          } else {
            waypoint.disable();
            current._displayCurrentPageDataAndSwitchToNext();
            Waypoint.refreshAll();
            waypoint.enable();
          }
        }
      },
      offset: 'bottom-in-view'
    });
  }

  _initConfig() {
    this._currentPage = 1;
    this._pageSize = this._options['pageSize'] ? this._options['pageSize'] : 25;
    this._isLastPage = false;
  }

  _displayCurrentPageDataAndSwitchToNext() {
    if (!this._isLastPage) {
      this._displayData();

      if (!this._isLastPage) {
        this._currentPage++;
      }
    }
  }

  _displayData() {
    let startIndex = this._getStartIndex();
    for (let index = 0; index < this._pageSize; index++) {
      let data = this._options['data'][index + startIndex];
      if (data != null) {
        this._generateSingleCachedData(data);
      } else {
        this._isLastPage = true;
      }
    }
  }

  _generateSingleCachedData(data) {
    let clonedHtml = $(this._options['dataTemplateNode']).html();

    let currentData = data;
    //所有花括号里面的内容都替换掉为相应变量值,
    // 如{lock} 替换为 this._options.context.lock 或 data.lock, 如果找不到，则不替换
    let replacedHtml = clonedHtml.replace(
      /({\w+})/g,
      function(param) {
        return current._replace(param, currentData, '{', '}');
      }
    );

    replacedHtml = replacedHtml.replace(
      /(%7B\w+%7D)/g,
      function(param) {
        return current._replace(param, currentData, '%7B', '%7D');
      }
    );

    let tempNode = $('<div>').append(replacedHtml);
    tempNode.find('[display-if=false]').remove();
    tempNode.find('[display-if=0]').remove();
    tempNode.find('[hide-if=1]').remove();
    tempNode.find('[hide-if=true]').remove();
    $('.infinite-container').append(tempNode.html());
  }

  _getStartIndex() {
    return (this._currentPage - 1) * this._pageSize;
  }

  _replace(param, currentData, firstReplaceStr, secondReplaceStr) {
    let paramName = param.split(firstReplaceStr)[1].split(secondReplaceStr)[0];
    let context = current._options.context;
    if (typeof context[paramName] == 'function') {
      return context[paramName](currentData, context);
    } else if (typeof currentData[paramName] != 'undefined') {
      return currentData[paramName];
    }
    return param;
  }
}