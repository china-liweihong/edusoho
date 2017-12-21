<?php

namespace AppBundle\Component\Activity;

use Codeages\Biz\Framework\Context\Biz;

class ActivityContext
{
    private $user;

    private $course;

    private $courseDraft;

    private $activity;

    private $task;

    private $biz;

    public function __construct(Biz $biz, $activity)
    {
        $this->biz = $biz;
        $this->activity = $activity;
    }

    public function getUser()
    {
        return $this->biz['user'];
    }

    public function getCourseDraft()
    {
        $user = $this->getUser();
        return $this->getCourseDraftService()->getCourseDraftByCourseIdAndActivityIdAndUserId($this->activity['fromCourseId'], 0, $user['id']);
    }

    public function getActivity()
    {
        return $this->activity;
    }

    public function getTask()
    {

    }

    /**
     * @return \Biz\Course\Service\CourseDraftService
     */
    private function getCourseDraftService()
    {
        return $this->biz->service('Course:CourseDraftService');
    }
}