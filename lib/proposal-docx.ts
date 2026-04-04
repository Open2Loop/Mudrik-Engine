/**
 * @project MUDRIK - AI Tender Consultant
 * @author Al-Baraa | البراء
 * @created March 2026
 * @status Stable Version 1.0
 * @copyright (c) 2026 All Rights Reserved
 * @legal_notice This source code and all its algorithms are the sole property of Al-Baraa.
 * Any unauthorized copying, modification, or distribution is strictly prohibited.
 * مشروع مُدْرِك - مستشار المنافسات الذكي
 * حقوق الملكية محفوظة (ج) ٢٠٢٦ - المؤلف: البراء
 */

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

export type ProposalPayload = {
  title_ar: string;
  executive_summary: string;
  technical_approach: string;
  timeline: string;
  pricing_notes: string;
  compliance_matrix_ar: string;
};

function buildMinimalTemplateBuffer(): Buffer {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:rtl/></w:rPr><w:t xml:space="preserve">{title_ar}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr><w:r><w:t xml:space="preserve">ملخص تنفيذي</w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:rtl/></w:rPr><w:t xml:space="preserve">{executive_summary}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr><w:r><w:t xml:space="preserve">النهج الفني</w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:rtl/></w:rPr><w:t xml:space="preserve">{technical_approach}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr><w:r><w:t xml:space="preserve">الجدول الزمني</w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:rtl/></w:rPr><w:t xml:space="preserve">{timeline}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr><w:r><w:t xml:space="preserve">الأسعار والشروط</w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:rtl/></w:rPr><w:t xml:space="preserve">{pricing_notes}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr><w:r><w:t xml:space="preserve">مصفوفة الامتثال</w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:bidi/><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:rtl/></w:rPr><w:t xml:space="preserve">{compliance_matrix_ar}</w:t></w:r>
    </w:p>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

  const zip = new PizZip();
  zip.file("[Content_Types].xml", contentTypes);
  zip.file("_rels/.rels", rels);
  zip.file("word/_rels/document.xml.rels", docRels);
  zip.file("word/document.xml", documentXml);

  return zip.generate({ type: "nodebuffer" }) as Buffer;
}

export function renderProposalDocx(data: ProposalPayload): Buffer {
  const template = buildMinimalTemplateBuffer();
  const zip = new PizZip(template);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter() {
      return "";
    },
  });
  doc.setData(data);
  doc.render();
  const out = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;
  return out;
}
