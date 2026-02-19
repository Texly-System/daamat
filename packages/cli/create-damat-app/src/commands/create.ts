import {
  ProjectCreatorFactory,
  ProjectOptions,
} from "../utils/projectCreator"

/**
 * Command handler to create a damat project or plugin
 */
export default async (args: string[], options: ProjectOptions) => {
  const projectCreator = await ProjectCreatorFactory.create(args, options)
  await projectCreator.create()
}
