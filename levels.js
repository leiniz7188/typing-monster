/* 打字小怪兽 · 莓莓学键盘 —— 关卡数据（六阶段全量 29 关） */
var LEVELS = {
  stages: [
    {
      id: 's1',
      name: '主键区',
      desc: '左手 A S D F · 右手 J K L ;，十个手指的家',
      levels: [
        { id: '1-1', name: '左手三兄弟', keys: ['f', 'd', 's'], count: 12 },
        { id: '1-2', name: '右手三兄弟', keys: ['j', 'k', 'l'], count: 12 },
        { id: '1-3', name: '左手四兄妹', keys: ['a', 's', 'd', 'f'], count: 12 },
        { id: '1-4', name: '右手四兄妹', keys: ['j', 'k', 'l', ';'], count: 12 },
        { id: '1-5', name: '双手大汇合', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], count: 16 },
        { id: '1-6', name: '食指伸伸腰', keys: ['g', 'h', 'f', 'j'], count: 12 },
        { id: '1-7', name: '主键区巡逻', keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'], count: 18 },
        { id: '1-8', name: '主键区冲刺', keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'], count: 20 }
      ]
    },
    {
      id: 's2',
      name: '上排键',
      desc: 'Q W E R T Y U I O P，手指向上够一够',
      levels: [
        { id: '2-1', name: '上排左手', keys: ['q', 'w', 'e', 'r', 'f', 'd', 's'], count: 14 },
        { id: '2-2', name: '上排右手', keys: ['y', 'u', 'i', 'o', 'p', 'j', 'k', 'l'], count: 14 },
        { id: '2-3', name: '上排大汇合', keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'f', 'j'], count: 16 },
        { id: '2-4', name: '上排冲刺', keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'f', 'j', 'd', 'k'], count: 18 }
      ]
    },
    {
      id: 's3',
      name: '下排键',
      desc: 'Z X C V B N M , . /，手指向下伸一伸',
      levels: [
        { id: '3-1', name: '下排左手', keys: ['z', 'x', 'c', 'v', 'a', 's', 'd', 'f'], count: 14 },
        { id: '3-2', name: '下排右手', keys: ['b', 'n', 'm', ',', '.', '/', 'j', 'k', 'l', ';'], count: 14 },
        { id: '3-3', name: '下排大汇合', keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'f', 'j'], count: 16 },
        { id: '3-4', name: '下排冲刺', keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'a', 's', 'd', 'k', 'l', ';'], count: 18 }
      ]
    },
    {
      id: 's4',
      name: '常用单词',
      desc: '把字母连成词，cat、dog、sun，边打边复习英语',
      levels: [
        { id: '4-1', name: '三字母小伙伴', words: ['cat', 'dog', 'sun', 'red', 'big', 'cup', 'hat', 'bed'] },
        { id: '4-2', name: '三字母新朋友', words: ['run', 'sit', 'top', 'box', 'egg', 'pig', 'bus', 'fun'] },
        { id: '4-3', name: '四字母小伙伴', words: ['fish', 'book', 'milk', 'star', 'tree', 'blue', 'gift', 'jump'] },
        { id: '4-4', name: '单词大混合', words: ['cat', 'dog', 'fish', 'book', 'red', 'blue', 'big', 'star', 'sun', 'tree'] },
        { id: '4-5', name: '单词小冲刺', words: ['cat', 'dog', 'pig', 'bus', 'sun', 'run', 'sit', 'top', 'fish', 'milk', 'star', 'jump'] }
      ]
    },
    {
      id: 's5',
      name: '拼音汉字',
      desc: '看到汉字打出它的拼音，好、学、谢谢，母语打字也要练',
      levels: [
        { id: '5-1', name: '单字小伙伴', hanzi: [
          { label: '好', chars: ['h', 'a', 'o'] },
          { label: '学', chars: ['x', 'u', 'e'] },
          { label: '谢', chars: ['x', 'i', 'e'] },
          { label: '天', chars: ['t', 'i', 'a', 'n'] },
          { label: '大', chars: ['d', 'a'] },
          { label: '小', chars: ['x', 'i', 'a', 'o'] },
          { label: '上', chars: ['s', 'h', 'a', 'n', 'g'] },
          { label: '下', chars: ['x', 'i', 'a'] }
        ] },
        { id: '5-2', name: '单字新朋友', hanzi: [
          { label: '水', chars: ['s', 'h', 'u', 'i'] },
          { label: '火', chars: ['h', 'u', 'o'] },
          { label: '山', chars: ['s', 'h', 'a', 'n'] },
          { label: '人', chars: ['r', 'e', 'n'] },
          { label: '口', chars: ['k', 'o', 'u'] },
          { label: '日', chars: ['r', 'i'] },
          { label: '月', chars: ['y', 'u', 'e'] },
          { label: '田', chars: ['t', 'i', 'a', 'n'] }
        ] },
        { id: '5-3', name: '词语小伙伴', hanzi: [
          { label: '你好', chars: ['n', 'i', 'h', 'a', 'o'] },
          { label: '谢谢', chars: ['x', 'i', 'e', 'x', 'i', 'e'] },
          { label: '学校', chars: ['x', 'u', 'e', 'x', 'i', 'a', 'o'] },
          { label: '老师', chars: ['l', 'a', 'o', 's', 'h', 'i'] },
          { label: '同学', chars: ['t', 'o', 'n', 'g', 'x', 'u', 'e'] },
          { label: '朋友', chars: ['p', 'e', 'n', 'g', 'y', 'o', 'u'] }
        ] },
        { id: '5-4', name: '词语新朋友', hanzi: [
          { label: '中国', chars: ['z', 'h', 'o', 'n', 'g', 'g', 'u', 'o'] },
          { label: '天空', chars: ['t', 'i', 'a', 'n', 'k', 'o', 'n', 'g'] },
          { label: '大海', chars: ['d', 'a', 'h', 'a', 'i'] },
          { label: '书本', chars: ['s', 'h', 'u', 'b', 'e', 'n'] },
          { label: '铅笔', chars: ['q', 'i', 'a', 'n', 'b', 'i'] },
          { label: '橡皮', chars: ['x', 'i', 'a', 'n', 'g', 'p', 'i'] }
        ] },
        { id: '5-5', name: '拼音小冲刺', hanzi: [
          { label: '好', chars: ['h', 'a', 'o'] },
          { label: '你好', chars: ['n', 'i', 'h', 'a', 'o'] },
          { label: '谢', chars: ['x', 'i', 'e'] },
          { label: '学校', chars: ['x', 'u', 'e', 'x', 'i', 'a', 'o'] },
          { label: '天', chars: ['t', 'i', 'a', 'n'] },
          { label: '大海', chars: ['d', 'a', 'h', 'a', 'i'] },
          { label: '水', chars: ['s', 'h', 'u', 'i'] },
          { label: '朋友', chars: ['p', 'e', 'n', 'g', 'y', 'o', 'u'] },
          { label: '上', chars: ['s', 'h', 'a', 'n', 'g'] },
          { label: '中国', chars: ['z', 'h', 'o', 'n', 'g', 'g', 'u', 'o'] }
        ] }
      ]
    },
    {
      id: 's6',
      name: '开口说句子',
      desc: '打出完整的句子，你就是打字小达人了',
      levels: [
        { id: '6-1', name: '两个词的句子', words: ['i run', 'i sit', 'i see', 'my cat', 'my dog', 'a fish', 'a bird', 'i jump'] },
        { id: '6-2', name: '三个词的句子', words: ['i like cats', 'i like dogs', 'i see a cat', 'i have a dog', 'my hat is red', 'the sun is up'] },
        { id: '6-3', name: '句子大混合', words: ['i run', 'i see a cat', 'my dog is big', 'i like fish', 'a red hat', 'the sun is up', 'i jump high', 'my cat can run'] }
      ]
    }
  ]
};
