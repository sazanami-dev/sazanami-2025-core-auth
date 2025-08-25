import chalk from 'chalk';

class Logger {

  private tags: string[] = [];

  constructor(tag?: string) {
    if (tag) {
      this.tags.push(tag);
    } else {
      this.tags.push('default');
    }
  }

  setTags(tags: string[]) {
    this.tags = tags;
  }

  setTag(tag: string) {
    this.tags = [tag];
  }

  getChild(tag: string) {
    const child = new Logger();
    child.setTags([...this.tags, tag]);
    return child;
  }

  private tagString(extraTag?: string) {
    return extraTag ? [...this.tags, extraTag].join('/') : this.tags.join('/');
  }

  info = (message: string, extraTag?: string) => {
    console.log(chalk.blue('[INFO]') + '\t ' + this.tagString(extraTag) + ':\t' + message);
  }

  warn = (message: string, extraTag?: string) => {
    console.log(chalk.yellow('[WARN]') + '\t ' + this.tagString(extraTag) + ':\t' + message);
  }

  error = (message: string, extraTag?: string) => {
    console.log(chalk.red('[ERROR]') + '\t ' + this.tagString(extraTag) + ':\t' + message);
  }

  debug = (message: string, extraTag?: string) => {
    console.log(chalk.gray('[DEBUG]') + '\t ' + this.tagString(extraTag) + ':\t' + message);
  }

  success = (message: string, extraTag?: string) => {
    console.log(chalk.green('[SUCC]') + '\t ' + this.tagString(extraTag) + ':\t' + message);
  }

  complete = (message: string, extraTag?: string) => {
    console.log(chalk.bgGreen(chalk.black('[DONE]')) + '\t ' + this.tagString(extraTag) + ':\t' + chalk.green(message));
  }
}

export default Logger;
