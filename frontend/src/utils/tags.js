export const TAG_TYPE_MAP = {
  '民族节日': 'primary',
  '传统庆典': 'info',
  '体育竞技': 'danger',
  '饮食习俗': 'success',
  '宗教祭祀': 'warning',
  '民间信仰': 'info',
  '民间表演': 'primary',
  '泼水祈福': 'success',
  '对歌传情': 'warning',
  '驱邪纳福': 'danger',
};

/**
 * 根据标签名称获取标签类型（颜色）
 * @param {string} tag - 标签名称
 * @returns {string} Element Plus tag type
 */
export function getTagType(tag) {
  return TAG_TYPE_MAP[tag] || 'info';
}
