import { Notice, Plugin, TFile, moment, App, Modal, Platform, TAbstractFile } from 'obsidian';
import { 
	LectureNotesSettingTab, 
	LectureNotesSettings, 
	DEFAULT_SETTINGS,
	SCHOOL_STAGES,
	SUBJECTS,
	SchoolStage,
	Subject
} from "./settings";

interface LectureInfo {
	course: string;
	teacher: string;
	schoolStage: SchoolStage;
	subject: Subject;
}

export default class LectureNotesPlugin extends Plugin {
	settings: LectureNotesSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('book-open', '创建听课笔记', () => {
			this.showLectureInputDialog();
		});

		this.addCommand({
			id: 'create-lecture-note',
			name: '创建听课笔记',
			callback: () => {
				this.showLectureInputDialog();
			}
		});

		this.addCommand({
			id: 'quick-create-lecture-note',
			name: '快速创建听课笔记（使用默认值）',
			callback: () => {
				this.quickCreateLectureNote();
			}
		});

		this.addCommand({
			id: 'create-lecture-note-today',
			name: '创建今日听课笔记',
			callback: () => {
				this.createTodayLectureNote();
			}
		});

		this.addSettingTab(new LectureNotesSettingTab(this.app, this));

		if (Platform.isMobile) {
			new Notice('听课笔记插件已加载 - 移动端模式');
		}
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<LectureNotesSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async showLectureInputDialog() {
		const lectureInfo = await this.getLectureInfoFromUser();
		if (lectureInfo) {
			await this.createLectureNote(lectureInfo);
		}
	}

	async quickCreateLectureNote() {
		const info: LectureInfo = {
			course: this.settings.defaultCourse || '听课笔记',
			teacher: this.settings.defaultTeacher,
			schoolStage: this.settings.defaultSchoolStage,
			subject: this.settings.defaultSubject
		};

		await this.createLectureNote(info);
	}

	async createTodayLectureNote() {
		const info: LectureInfo = {
			course: this.settings.defaultCourse || '今日听课',
			teacher: this.settings.defaultTeacher,
			schoolStage: this.settings.defaultSchoolStage,
			subject: this.settings.defaultSubject
		};

		await this.createLectureNote(info);
	}

	async getLectureInfoFromUser(): Promise<LectureInfo | null> {
		return new Promise((resolve) => {
			const modal = new LectureInputModal(this.app, this.settings, (result) => {
				resolve(result);
			});
			modal.open();
		});
	}

	async createLectureNote(info: LectureInfo) {
		try {
			const filePath = this.generateFilePath(info);
			const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));

			await this.ensureFolderExists(folderPath);

			if (await this.app.vault.adapter.exists(filePath)) {
				const file = this.app.vault.getAbstractFileByPath(filePath);
				if (file instanceof TFile) {
					await this.app.workspace.getLeaf().openFile(file);
					new Notice('听课笔记已存在，已打开');
				}
				return;
			}

			const content = await this.generateContent(info);
			const file = await this.app.vault.create(filePath, content);
			const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
			new Notice(`已创建听课笔记: ${fileName}`);

			if (this.settings.openOnCreate && file instanceof TFile) {
				await this.app.workspace.getLeaf().openFile(file);
			}
		} catch (error) {
			new Notice('创建听课笔记失败: ' + (error as Error).message);
			console.error('创建听课笔记失败:', error);
		}
	}

	async ensureFolderExists(folderPath: string) {
		if (!folderPath || folderPath === '.') {
			return;
		}

		const folders = folderPath.split('/').filter(f => f.length > 0);
		let currentPath = '';

		for (const folder of folders) {
			currentPath = currentPath ? `${currentPath}/${folder}` : folder;
			
			if (!await this.app.vault.adapter.exists(currentPath)) {
				await this.app.vault.createFolder(currentPath);
				new Notice(`已创建文件夹: ${currentPath}`);
			}
		}
	}

	generateFilePath(info: LectureInfo): string {
		const date = moment();
		const now = moment();
		
		let path = this.settings.folderPath;
		let fileName = this.settings.fileNameFormat;
		
		fileName = this.replaceVariables(fileName, info, date, now);
		path = this.replaceVariables(path, info, date, now);

		fileName = fileName.replace(/[\\:*?"<>|]/g, '-');
		path = path.replace(/[\\:*?"<>|]/g, '-');

		if (fileName.includes('/')) {
			const parts = fileName.split('/').map(p => p.trim()).filter(p => p.length > 0);
			if (parts.length > 1) {
				const folders = parts.slice(0, -1);
				const actualFileName = parts[parts.length - 1] || 'untitled';
				
				path = path ? `${path}/${folders.join('/')}` : folders.join('/');
				fileName = actualFileName;
			}
		}

		if (path.includes('/')) {
			const pathParts = path.split('/').map(part => part.trim()).filter(part => part.length > 0);
			path = pathParts.join('/');
		}

		return `${path}/${fileName}.md`;
	}

	replaceVariables(text: string, info: LectureInfo, date: moment.Moment, now: moment.Moment): string {
		let result = text;
		
		result = result.replace(/\{\{course\}\}/g, info.course);
		result = result.replace(/\{\{teacher\}\}/g, info.teacher);
		result = result.replace(/\{\{date\}\}/g, date.format('YYYY-MM-DD'));
		result = result.replace(/\{\{year\}\}/g, date.format('YYYY'));
		result = result.replace(/\{\{month\}\}/g, date.format('MM'));
		result = result.replace(/\{\{day\}\}/g, date.format('DD'));
		result = result.replace(/\{\{schoolStage\}\}/g, info.schoolStage);
		result = result.replace(/\{\{subject\}\}/g, info.subject);
		
		result = result.replace(/\{\{timestamp\}\}/g, now.format('X'));
		result = result.replace(/\{\{datetime\}\}/g, now.format('YYYY-MM-DD-HHmmss'));
		result = result.replace(/\{\{time\}\}/g, now.format('HHmmss'));
		result = result.replace(/\{\{weekday\}\}/g, date.format('dddd'));
		result = result.replace(/\{\{weekdayShort\}\}/g, date.format('ddd'));
		result = result.replace(/\{\{week\}\}/g, date.format('ww'));
		result = result.replace(/\{\{quarter\}\}/g, date.format('Q'));
		
		return result;
	}

	async generateContent(info: LectureInfo): Promise<string> {
		const date = moment();
		const now = moment();
		
		let template = await this.getTemplate();
		let content = this.replaceVariables(template, info, date, now);
		content = content.replace(/\{\{location\}\}/g, '');
		
		return content;
	}

	async getTemplate(): Promise<string> {
		if (!this.settings.templatePath) {
			return this.getDefaultTemplate();
		}

		try {
			const file = this.app.vault.getAbstractFileByPath(this.settings.templatePath);
			if (file instanceof TFile) {
				const content = await this.app.vault.read(file);
				return content;
			}
		} catch (error) {
			new Notice(`无法读取模板文件: ${this.settings.templatePath}，使用默认模板`);
			console.error('读取模板文件失败:', error);
		}

		return this.getDefaultTemplate();
	}

	getDefaultTemplate(): string {
		return `# {{course}} - {{date}}

**学段：** {{schoolStage}}  
**学科：** {{subject}}  
**讲师：** {{teacher}}  
**时间：** {{date}}  
**地点：** 

---

## 📚 课程概述


## 📝 主要内容

### 1. 


### 2. 


### 3. 


## 💡 重点与难点

### 重点


### 难点


## 🤔 思考与疑问


## 📖 参考资料


## ✅ 课后任务

- [ ] 
- [ ] 

## 💭 个人总结

`;
	}
}

class LectureInputModal extends Modal {
	private callback: (result: LectureInfo | null) => void;
	private settings: LectureNotesSettings;
	private courseInput!: HTMLInputElement;
	private teacherInput!: HTMLInputElement;
	private schoolStageSelect!: HTMLSelectElement;
	private subjectSelect!: HTMLSelectElement;

	constructor(app: App, settings: LectureNotesSettings, callback: (result: LectureInfo | null) => void) {
		super(app);
		this.settings = settings;
		this.callback = callback;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl('h2', { text: '创建听课笔记' });

		const form = contentEl.createEl('form');
		form.style.marginTop = Platform.isMobile ? '10px' : '20px';

		if (Platform.isMobile) {
			const row1 = this.createRow(form);
			this.schoolStageSelect = this.createSelectField(row1, '学段：', SCHOOL_STAGES, this.settings.defaultSchoolStage, true);
			this.subjectSelect = this.createSelectField(row1, '学科：', SUBJECTS, this.settings.defaultSubject, true);

			const row2 = this.createRow(form);
			this.courseInput = this.createInputField(row2, '课程：', this.settings.defaultCourse, true);
			this.teacherInput = this.createInputField(row2, '讲师：', this.settings.defaultTeacher, true);
		} else {
			this.schoolStageSelect = this.createSelectField(form, '学段：', SCHOOL_STAGES, this.settings.defaultSchoolStage);
			this.subjectSelect = this.createSelectField(form, '学科：', SUBJECTS, this.settings.defaultSubject);
			this.courseInput = this.createInputField(form, '课程名称：', this.settings.defaultCourse);
			this.teacherInput = this.createInputField(form, '讲师：', this.settings.defaultTeacher);
		}

		const tipContainer = form.createDiv();
		tipContainer.style.marginTop = '15px';
		tipContainer.style.padding = '10px';
		tipContainer.style.background = 'var(--background-secondary)';
		tipContainer.style.borderRadius = '4px';
		tipContainer.style.textAlign = 'center';
		tipContainer.style.color = 'var(--text-muted)';
		tipContainer.style.fontSize = Platform.isMobile ? '14px' : '13px';
		tipContainer.createEl('span', { text: '💡 输入信息后按"回车"键创建' });

		const buttonContainer = form.createDiv();
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';
		buttonContainer.style.marginTop = Platform.isMobile ? '15px' : '20px';
		buttonContainer.style.flexDirection = Platform.isMobile ? 'column' : 'row';

		const cancelButton = buttonContainer.createEl('button', { text: '取消' });
		cancelButton.type = 'button';
		cancelButton.style.width = Platform.isMobile ? '100%' : 'auto';
		cancelButton.onclick = () => {
			this.callback(null);
			this.close();
		};

		const submitButton = buttonContainer.createEl('button', { text: '创建' });
		submitButton.type = 'submit';
		submitButton.classList.add('mod-cta');
		submitButton.style.width = Platform.isMobile ? '100%' : 'auto';

		form.onsubmit = (e) => {
			e.preventDefault();
			const result: LectureInfo = {
				course: this.courseInput.value.trim(),
				teacher: this.teacherInput.value.trim(),
				schoolStage: this.schoolStageSelect.value as SchoolStage,
				subject: this.subjectSelect.value as Subject
			};

			if (!result.course) {
				new Notice('请输入课程名称');
				return;
			}

			this.callback(result);
			this.close();
		};

		this.courseInput.focus();
	}

	private createRow(container: HTMLElement): HTMLDivElement {
		const row = container.createDiv();
		row.style.display = 'flex';
		row.style.gap = '10px';
		row.style.marginBottom = '12px';
		return row;
	}

	private createInputField(container: HTMLElement, labelText: string, defaultValue: string, isHalfWidth: boolean = false): HTMLInputElement {
		const inputContainer = container.createDiv();
		inputContainer.style.marginBottom = Platform.isMobile ? '12px' : '15px';
		if (isHalfWidth) {
			inputContainer.style.flex = '1';
			inputContainer.style.marginBottom = '0';
		}

		const label = inputContainer.createEl('label', { text: labelText });
		label.style.display = 'block';
		label.style.marginBottom = '5px';
		label.style.fontWeight = '500';
		label.style.fontSize = Platform.isMobile ? '16px' : 'inherit';

		const input = inputContainer.createEl('input', { type: 'text' });
		input.value = defaultValue;
		input.style.width = '100%';
		input.style.padding = Platform.isMobile ? '12px' : '8px';
		input.style.borderRadius = '4px';
		input.style.border = '1px solid var(--background-modifier-border)';
		input.style.background = 'var(--background-primary)';
		input.style.color = 'var(--text-normal)';
		input.style.fontSize = Platform.isMobile ? '16px' : 'inherit';

		return input;
	}

	private createSelectField(
		container: HTMLElement, 
		labelText: string, 
		options: readonly string[], 
		defaultValue: string,
		isHalfWidth: boolean = false
	): HTMLSelectElement {
		const selectContainer = container.createDiv();
		selectContainer.style.marginBottom = Platform.isMobile ? '12px' : '15px';
		if (isHalfWidth) {
			selectContainer.style.flex = '1';
			selectContainer.style.marginBottom = '0';
		}

		const label = selectContainer.createEl('label', { text: labelText });
		label.style.display = 'block';
		label.style.marginBottom = '5px';
		label.style.fontWeight = '500';
		label.style.fontSize = Platform.isMobile ? '16px' : 'inherit';

		const select = selectContainer.createEl('select');
		select.style.width = '100%';
		select.style.padding = Platform.isMobile ? '12px' : '8px';
		select.style.borderRadius = '4px';
		select.style.border = '1px solid var(--background-modifier-border)';
		select.style.background = 'var(--background-primary)';
		select.style.color = 'var(--text-normal)';
		select.style.fontSize = Platform.isMobile ? '16px' : 'inherit';

		options.forEach(option => {
			const optionEl = select.createEl('option', { text: option });
			optionEl.value = option;
			if (option === defaultValue) {
				optionEl.selected = true;
			}
		});

		return select;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
