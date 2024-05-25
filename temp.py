from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline

# 加载预训练的BERT-NER模型和分词器
tokenizer = AutoTokenizer.from_pretrained("ckiplab/bert-base-chinese-ner")
model = AutoModelForTokenClassification.from_pretrained("ckiplab/bert-base-chinese-ner")

# 定义自动标注函数
def auto_label(text):
    nlp = pipeline("ner", model=model, tokenizer=tokenizer)
    entities = nlp(text)
    
    # 将实体位置映射回原始文本
    labeled_text = ""
    last_end = 0
    for ent in entities:
        start, end, label = ent['start'], ent['end'], ent['entity']
        if label == 'LOC':
            labeled_text += text[last_end:start] + f"[{text[start:end]}|LOC]"
        else:
            labeled_text += text[last_end:end]
        last_end = end
    labeled_text += text[last_end:]
    
    # 将实体标签转换为BIO格式
    labels = ["O"] * len(text)
    for ent in entities:
        start, end, label = ent['start'], ent['end'], ent['entity']
        if label == 'LOC':
            labels[start] = f"B-{label}"
            for i in range(start+1, end):
                labels[i] = f"I-{label}"
    
    return labeled_text, labels

# 对示例文本进行自动标注
text = "请尽快处理网友反映的北京市海淀区西土城路10号中关村大厦A座1008室的噪音扰民问题"
labeled_text, labels = auto_label(text)
print(labeled_text)
print(labels)