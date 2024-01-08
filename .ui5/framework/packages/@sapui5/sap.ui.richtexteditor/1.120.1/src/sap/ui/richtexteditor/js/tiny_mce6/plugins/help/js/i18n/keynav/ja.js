/*!
 * TinyMCE
 *
 * Copyright (c) 2023 Ephox Corporation DBA Tiny Technologies, Inc.
 * Licensed under the Tiny commercial license. See https://www.tiny.cloud/legal/
 */
tinymce.Resource.add('tinymce.html-i18n.help-keynav.ja',
'<h1>キーボード ナビゲーションの開始</h1>\n' +
  '\n' +
  '<dl>\n' +
  '  <dt>メニュー バーをフォーカス</dt>\n' +
  '  <dd>Windows または Linux: Alt+F9</dd>\n' +
  '  <dd>macOS: &#x2325;F9</dd>\n' +
  '  <dt>ツール バーをフォーカス</dt>\n' +
  '  <dd>Windows または Linux: Alt+F10</dd>\n' +
  '  <dd>macOS: &#x2325;F10</dd>\n' +
  '  <dt>フッターをフォーカス</dt>\n' +
  '  <dd>Windows または Linux: Alt+F11</dd>\n' +
  '  <dd>macOS: &#x2325;F11</dd>\n' +
  '  <dt>コンテキスト ツール バーをフォーカス</dt>\n' +
  '  <dd>Windows、Linux または macOS: Ctrl+F9\n' +
  '</dl>\n' +
  '\n' +
  '<p>ナビゲーションは最初の UI 項目から開始され、強調表示されるか、フッターの要素パスにある最初の項目の場合は\n' +
  '  下線が引かれます。</p>\n' +
  '\n' +
  '<h1>UI セクション間の移動</h1>\n' +
  '\n' +
  '<p>次の UI セクションに移動するには、<strong>Tab</strong> を押します。</p>\n' +
  '\n' +
  '<p>前の UI セクションに移動するには、<strong>Shift+Tab</strong> を押します。</p>\n' +
  '\n' +
  '<p>これらの UI セクションの <strong>Tab</strong> の順序:\n' +
  '\n' +
  '<ol>\n' +
  '  <li>メニュー バー</li>\n' +
  '  <li>各ツール バー グループ</li>\n' +
  '  <li>サイド バー</li>\n' +
  '  <li>フッターの要素パス</li>\n' +
  '  <li>フッターの単語数切り替えボタン</li>\n' +
  '  <li>フッターのブランド リンク</li>\n' +
  '  <li>フッターのエディター サイズ変更ハンドル</li>\n' +
  '</ol>\n' +
  '\n' +
  '<p>UI セクションが存在しない場合は、スキップされます。</p>\n' +
  '\n' +
  '<p>フッターにキーボード ナビゲーション フォーカスがあり、表示可能なサイド バーがない場合、<strong>Shift+Tab</strong> を押すと、\n' +
  '  フォーカスが最後ではなく最初のツール バー グループに移動します。\n' +
  '\n' +
  '<h1>UI セクション内の移動</h1>\n' +
  '\n' +
  '<p>次の UI 要素に移動するには、適切な<strong>矢印</strong>キーを押します。</p>\n' +
  '\n' +
  '<p><strong>左矢印</strong>と<strong>右矢印</strong>のキー</p>\n' +
  '\n' +
  '<ul>\n' +
  '  <li>メニュー バーのメニュー間で移動します。</li>\n' +
  '  <li>メニュー内のサブメニューを開きます。</li>\n' +
  '  <li>ツール バー グループのボタン間で移動します。</li>\n' +
  '  <li>フッターの要素パスの項目間で移動します。</li>\n' +
  '</ul>\n' +
  '\n' +
  '<p><strong>下矢印</strong>と<strong>上矢印</strong>のキー\n' +
  '\n' +
  '<ul>\n' +
  '  <li>メニュー内のメニュー項目間で移動します。</li>\n' +
  '  <li>ツール バー ポップアップ メニュー内のメニュー項目間で移動します。</li>\n' +
  '</ul>\n' +
  '\n' +
  '<p><strong>矢印</strong>キーで、フォーカスされた UI セクション内で循環します。</p>\n' +
  '\n' +
  '<p>開いたメニュー、開いたサブメニュー、開いたポップアップ メニューを閉じるには、<strong>Esc</strong> キーを押します。\n' +
  '\n' +
  '<p>現在のフォーカスが特定の UI セクションの「一番上」にある場合、<strong>Esc</strong> キーを押すと\n' +
  '  キーボード ナビゲーションも完全に閉じられます。</p>\n' +
  '\n' +
  '<h1>メニュー項目またはツール バー ボタンの実行</h1>\n' +
  '\n' +
  '<p>目的のメニュー項目やツール バー ボタンが強調表示されている場合、<strong>リターン</strong>、<strong>Enter</strong>、\n' +
  '  または<strong>スペース キー</strong>を押して項目を実行します。\n' +
  '\n' +
  '<h1>タブのないダイアログの移動</h1>\n' +
  '\n' +
  '<p>タブのないダイアログでは、ダイアログが開くと最初の対話型コンポーネントがフォーカスされます。</p>\n' +
  '\n' +
  '<p><strong>Tab</strong> または <strong>Shift+Tab</strong> を押して、対話型ダイアログ コンポーネント間で移動します。</p>\n' +
  '\n' +
  '<h1>タブ付きダイアログの移動</h1>\n' +
  '\n' +
  '<p>タブ付きダイアログでは、ダイアログが開くとタブ メニューの最初のボタンがフォーカスされます。</p>\n' +
  '\n' +
  '<p><strong>Tab</strong> または\n' +
  '  <strong>Shift+Tab</strong> を押して、このダイアログ タブの対話型コンポーネント間で移動します。</p>\n' +
  '\n' +
  '<p>タブ メニューをフォーカスしてから適切な<strong>矢印</strong>キーを押して表示可能なタブを循環して、\n' +
  '  別のダイアログに切り替えます。</p>\n');