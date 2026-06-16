<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑节日' : '新增节日'"
    width="520px"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="resetForm"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="如：泼水节" />
      </el-form-item>
      <el-form-item label="地区" prop="region">
        <el-input v-model="form.region" placeholder="如：云南" />
      </el-form-item>
      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="请选择或输入标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in tagOptions"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="日期说明" prop="date_description">
        <el-input
          v-model="form.date_description"
          type="textarea"
          :rows="2"
          placeholder="节日日期或周期说明"
        />
      </el-form-item>
      <el-form-item label="习俗摘要" prop="custom_summary">
        <el-input
          v-model="form.custom_summary"
          type="textarea"
          :rows="3"
          placeholder="主要民俗活动与寓意"
        />
      </el-form-item>
      <el-form-item label="来源" prop="source">
        <el-input v-model="form.source" placeholder="资料出处" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useFestivalStore } from '../stores/festival';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  festival: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'submit']);

const store = useFestivalStore();

const formRef = ref(null);
const submitting = ref(false);

const tagOptions = computed(() => {
  const presetTags = [
    '民族节日',
    '饮食习俗',
    '宗教祭祀',
    '传统庆典',
    '体育竞技',
    '民间信仰',
    '民间表演',
    '泼水祈福',
    '对歌传情',
    '驱邪纳福',
  ];
  const allTags = new Set([...presetTags, ...store.tags]);
  return Array.from(allTags).sort();
});

const emptyForm = () => ({
  name: '',
  region: '',
  tags: [],
  date_description: '',
  custom_summary: '',
  source: '',
});

const form = ref(emptyForm());

const isEdit = computed(() => Boolean(props.festival?.id));

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  region: [{ required: true, message: '请输入地区', trigger: 'blur' }],
  date_description: [{ required: true, message: '请输入日期说明', trigger: 'blur' }],
  custom_summary: [{ required: true, message: '请输入习俗摘要', trigger: 'blur' }],
  source: [{ required: true, message: '请输入来源', trigger: 'blur' }],
};

/**
 * 编辑时回填表单
 */
watch(
  () => props.festival,
  (val) => {
    if (val) {
      form.value = {
        name: val.name,
        region: val.region,
        tags: Array.isArray(val.tags) ? [...val.tags] : [],
        date_description: val.date_description,
        custom_summary: val.custom_summary,
        source: val.source,
      };
    } else {
      form.value = emptyForm();
    }
  },
  { immediate: true }
);

/**
 * 重置表单校验状态
 */
function resetForm() {
  form.value = emptyForm();
  formRef.value?.clearValidate();
}

/**
 * 提交表单
 */
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    emit('submit', { ...form.value });
  } finally {
    submitting.value = false;
  }
}
</script>
