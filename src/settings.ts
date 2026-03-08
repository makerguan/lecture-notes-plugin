import { App, PluginSettingTab, Setting, TFile, TFolder, TAbstractFile, Modal } from "obsidian";
import LectureNotesPlugin from "./main";

export const SCHOOL_STAGES = ['高中', '初中', '小学'] as const;
export const SUBJECTS = [
	'道德与法治', '语文', '数学', '外语（英语）', '历史', '地理', 
	'科学', '物理', '化学', '生物', '信息科技', '体育与健康', 
	'音乐', '美术', '劳动', '综合实践活动', '班队', '其它'
] as const;

export type SchoolStage = typeof SCHOOL_STAGES[number];
export type Subject = typeof SUBJECTS[number];

export interface LectureNotesSettings {
	folderPath: string;
	templatePath: string;
	fileNameFormat: string;
	openOnCreate: boolean;
	defaultCourse: string;
	defaultTeacher: string;
	defaultSchoolStage: SchoolStage;
	defaultSubject: Subject;
}

export const DEFAULT_SETTINGS: LectureNotesSettings = {
	folderPath: '听课笔记',
	templatePath: '',
	fileNameFormat: '{{date}}-{{subject}}',
	openOnCreate: true,
	defaultCourse: '',
	defaultTeacher: '',
	defaultSchoolStage: '高中',
	defaultSubject: '语文'
}

export class LectureNotesSettingTab extends PluginSettingTab {
	plugin: LectureNotesPlugin;
	private templatePathInput!: HTMLInputElement;

	constructor(app: App, plugin: LectureNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('保存文件夹')
			.setDesc('听课笔记的保存路径（支持使用 / 创建子文件夹，如：{{year}}/{{subject}}）')
			.addText(text => text
				.setPlaceholder('听课笔记')
				.setValue(this.plugin.settings.folderPath)
				.onChange(async (value) => {
					this.plugin.settings.folderPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('文件名格式')
			.setDesc('支持使用 / 创建文件夹。变量: {{course}}, {{teacher}}, {{date}}, {{year}}, {{month}}, {{day}}, {{schoolStage}}, {{subject}}, {{timestamp}}, {{datetime}}, {{time}}, {{week}}, {{quarter}}')
			.addText(text => text
				.setPlaceholder('{{date}}-{{subject}}')
				.setValue(this.plugin.settings.fileNameFormat)
				.onChange(async (value) => {
					this.plugin.settings.fileNameFormat = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('模板文件')
			.setDesc('选择库中的笔记作为模板（支持变量），留空使用默认模板')
			.addText(text => {
				text.setPlaceholder('模板/听课笔记模板.md')
					.setValue(this.plugin.settings.templatePath)
					.onChange(async (value) => {
						this.plugin.settings.templatePath = value;
						await this.plugin.saveSettings();
					});
				this.templatePathInput = text.inputEl;
			})
			.addButton(button => button
				.setButtonText('浏览')
				.onClick(() => {
					new TemplateFileSuggestModal(this.app, this.plugin, this.templatePathInput).open();
				}));

		new Setting(containerEl)
			.setName('默认学段')
			.setDesc('预设的学段，可在创建时修改')
			.addDropdown(dropdown => {
				SCHOOL_STAGES.forEach(stage => {
					dropdown.addOption(stage, stage);
				});
				dropdown
					.setValue(this.plugin.settings.defaultSchoolStage)
					.onChange(async (value) => {
						this.plugin.settings.defaultSchoolStage = value as SchoolStage;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('默认学科')
			.setDesc('预设的学科，可在创建时修改')
			.addDropdown(dropdown => {
				SUBJECTS.forEach(subject => {
					dropdown.addOption(subject, subject);
				});
				dropdown
					.setValue(this.plugin.settings.defaultSubject)
					.onChange(async (value) => {
						this.plugin.settings.defaultSubject = value as Subject;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName('默认课程名称')
			.setDesc('预设的课程名称，可在创建时修改')
			.addText(text => text
				.setPlaceholder('输入默认课程名称')
				.setValue(this.plugin.settings.defaultCourse)
				.onChange(async (value) => {
					this.plugin.settings.defaultCourse = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('默认讲师')
			.setDesc('预设的讲师姓名，可在创建时修改')
			.addText(text => text
				.setPlaceholder('输入默认讲师')
				.setValue(this.plugin.settings.defaultTeacher)
				.onChange(async (value) => {
					this.plugin.settings.defaultTeacher = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('创建后打开')
			.setDesc('创建笔记后自动打开文件')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.openOnCreate)
				.onChange(async (value) => {
					this.plugin.settings.openOnCreate = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: '变量说明' });
		
		const variablesDiv = containerEl.createDiv();
		variablesDiv.style.marginTop = '10px';
		variablesDiv.style.padding = '10px';
		variablesDiv.style.background = 'var(--background-secondary)';
		variablesDiv.style.borderRadius = '4px';
		
		const basicVars = variablesDiv.createEl('p');
		basicVars.innerHTML = '<strong>基础变量：</strong><br>' +
			'• {{course}} - 课程名称<br>' +
			'• {{teacher}} - 讲师<br>' +
			'• {{schoolStage}} - 学段<br>' +
			'• {{subject}} - 学科';
		
		const dateVars = variablesDiv.createEl('p');
		dateVars.innerHTML = '<strong>日期变量：</strong><br>' +
			'• {{date}} - 日期 (YYYY-MM-DD)<br>' +
			'• {{year}} - 年份<br>' +
			'• {{month}} - 月份<br>' +
			'• {{day}} - 日期<br>' +
			'• {{weekday}} - 星期几 (完整)<br>' +
			'• {{weekdayShort}} - 星期几 (简写)<br>' +
			'• {{week}} - 年中第几周<br>' +
			'• {{quarter}} - 季度';
		
		const systemVars = variablesDiv.createEl('p');
		systemVars.innerHTML = '<strong>系统变量：</strong><br>' +
			'• {{timestamp}} - Unix 时间戳<br>' +
			'• {{datetime}} - 完整日期时间 (YYYY-MM-DD-HHmmss)<br>' +
			'• {{time}} - 时间 (HHmmss)';
		
		const folderTip = variablesDiv.createEl('p');
		folderTip.innerHTML = '<strong>💡 文件夹创建：</strong><br>' +
			'在"保存文件夹"或"文件名格式"中使用 / 可以自动创建多级文件夹<br>' +
			'例如：{{year}}/{{subject}} 或 {{subject}}/{{date}}';
		
		const templateTip = variablesDiv.createEl('p');
		templateTip.innerHTML = '<strong>💡 模板文件：</strong><br>' +
			'模板文件支持所有变量，变量会在创建笔记时自动替换<br>' +
			'可以使用库中的任何 Markdown 文件作为模板';
	}
}

import { FuzzySuggestModal, Notice } from 'obsidian';

class TemplateFileSuggestModal extends FuzzySuggestModal<TFile> {
	plugin: LectureNotesPlugin;
	templatePathInput: HTMLInputElement;

	constructor(app: App, plugin: LectureNotesPlugin, templatePathInput: HTMLInputElement) {
		super(app);
		this.plugin = plugin;
		this.templatePathInput = templatePathInput;
	}

	getItems(): TFile[] {
		const files: TFile[] = [];
		this.app.vault.getMarkdownFiles().forEach(file => {
			files.push(file);
		});
		return files;
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile, evt: MouseEvent | KeyboardEvent): void {
		this.plugin.settings.templatePath = file.path;
		this.plugin.saveSettings();
		
		this.templatePathInput.value = file.path;
		
		this.templatePathInput.dispatchEvent(new Event('input', { bubbles: true }));
		
		new Notice(`已选择模板: ${file.path}`);
	}
}
